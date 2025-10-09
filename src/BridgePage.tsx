import React, { useEffect, useMemo, useState } from 'react';
import {
  BrowserProvider,
  Contract,
  Signer,
  formatUnits,
  isAddress,
  parseUnits,
  zeroPadValue,
} from 'ethers';
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PlugZap,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import { OFT_ADAPTER_ABI } from './abis/oftAdapter';
import { ERC20_ABI } from './abis/erc20';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    };
  }
}

const SONIC_OAPP_ADDRESS = '0x4Fef28A829DCFF8741de4460a9d26a733b50D5fa';
const SONIC_TOKEN_ADDRESS = '0xe13de1217939A6a7A2f93732685af892c84E2A7a';
const BASE_OAPP_ADDRESS = '0x6E1c500EFd26D23a35408C63f315EaEDBCF4498F';
const BASE_TOKEN_ADDRESS = '0x6E1c500EFd26D23a35408C63f315EaEDBCF4498F'; 
const BASE_EID = 30184;
const SONIC_EID = 30332;

const SONIC_CHAIN_ID = 146; // Sonic mainnet chain id (update if network changes)
const SONIC_CHAIN_HEX = `0x${SONIC_CHAIN_ID.toString(16)}`;
const SONIC_RPC_URL = 'https://rpc.soniclabs.com';
const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_HEX = `0x${BASE_CHAIN_ID.toString(16)}`;
const BASE_RPC_URL = 'https://mainnet.base.org';

const DEFAULT_SLIPPAGE = 5;
const EXTRA_OPTIONS = '0x';
const TOKEN_SYMBOL = 'AII';

type ChainKey = 'SONIC' | 'BASE';

type ChainConfig = {
  key: ChainKey;
  label: string;
  chainId: number;
  chainHex: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  oappAddress: string;
  tokenAddress?: string;
};

type BridgeDirection = 'SONIC_TO_BASE' | 'BASE_TO_SONIC';

type BridgeRoute = {
  source: ChainConfig;
  destination: ChainConfig;
  dstEid: number;
};

const CHAIN_CONFIG: Record<ChainKey, ChainConfig> = {
  SONIC: {
    key: 'SONIC',
    label: 'Sonic',
    chainId: SONIC_CHAIN_ID,
    chainHex: SONIC_CHAIN_HEX,
    rpcUrls: [SONIC_RPC_URL],
    blockExplorerUrls: ['https://explorer.soniclabs.com'],
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    oappAddress: SONIC_OAPP_ADDRESS,
    tokenAddress: SONIC_TOKEN_ADDRESS,
  },
  BASE: {
    key: 'BASE',
    label: 'Base',
    chainId: BASE_CHAIN_ID,
    chainHex: BASE_CHAIN_HEX,
    rpcUrls: [BASE_RPC_URL],
    blockExplorerUrls: ['https://basescan.org'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    oappAddress: BASE_OAPP_ADDRESS,
    tokenAddress: BASE_TOKEN_ADDRESS || undefined,
  },
};

const BRIDGE_ROUTES: Record<BridgeDirection, BridgeRoute> = {
  SONIC_TO_BASE: {
    source: CHAIN_CONFIG.SONIC,
    destination: CHAIN_CONFIG.BASE,
    dstEid: BASE_EID,
  },
  BASE_TO_SONIC: {
    source: CHAIN_CONFIG.BASE,
    destination: CHAIN_CONFIG.SONIC,
    dstEid: SONIC_EID,
  },
};

const addressToBytes32 = (address: string) => zeroPadValue(address, 32);

const formatError = (error: unknown) => {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Unknown error');
  }
  return 'Unknown error';
};

const isEthersError = (error: unknown): error is { code?: string | number } =>
  typeof error === 'object' && error !== null && 'code' in error;

type MessagingFee = { nativeFee: bigint; lzTokenFee: bigint };

type EthAccountChangeHandler = (accounts: string[]) => void;
type EthChainChangeHandler = (chainId: string) => void;

const BridgePage: React.FC = () => {
  const [direction, setDirection] = useState<BridgeDirection>('SONIC_TO_BASE');
  const [signer, setSigner] = useState<Signer | null>(null);
  const [account, setAccount] = useState('');
  const [networkChainId, setNetworkChainId] = useState<number | null>(null);

  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [allowance, setAllowance] = useState<bigint>(0n);

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [slippagePercent, setSlippagePercent] = useState(DEFAULT_SLIPPAGE);

  const [isApproving, setIsApproving] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [quote, setQuote] = useState<MessagingFee | null>(null);

  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const activeRoute = useMemo(() => BRIDGE_ROUTES[direction], [direction]);
  const sourceConfig = activeRoute.source;
  const destinationConfig = activeRoute.destination;
  const sourceTokenAddress = sourceConfig.tokenAddress;
  const sourceOappAddress = sourceConfig.oappAddress;
  const destinationOappAddress = destinationConfig.oappAddress;

  const oftContract = useMemo(
    () => (signer ? new Contract(sourceOappAddress, OFT_ADAPTER_ABI, signer) : null),
    [signer, sourceOappAddress]
  );

  const tokenContract = useMemo(
    () => (signer && sourceTokenAddress ? new Contract(sourceTokenAddress, ERC20_ABI, signer) : null),
    [signer, sourceTokenAddress]
  );

  const amountLD = useMemo(() => {
    try {
      if (!amount) return 0n;
      return parseUnits(amount, tokenDecimals);
    } catch {
      return 0n;
    }
  }, [amount, tokenDecimals]);

  const normalizedSlippage = useMemo(() => {
    if (Number.isNaN(slippagePercent)) return DEFAULT_SLIPPAGE;
    return Math.min(Math.max(slippagePercent, 0), 99);
  }, [slippagePercent]);

  const minAmountLD = useMemo(() => {
    if (amountLD === 0n) return 0n;
    const numerator = BigInt(100 - normalizedSlippage);
    return (amountLD * numerator) / 100n;
  }, [amountLD, normalizedSlippage]);

  const isTokenConfigured = Boolean(sourceTokenAddress);
  const needsApproval = Boolean(account && tokenContract && amountLD > allowance);
  const hasSufficientBalance = tokenContract ? amountLD <= tokenBalance : true;
  const isRecipientValid = isAddress(recipient || '0x0000000000000000000000000000000000000000');
  const isOnSourceChain = networkChainId === sourceConfig.chainId;
  const sourceNativeSymbol = sourceConfig.nativeCurrency.symbol;
  const sourceLabel = sourceConfig.label;
  const destinationLabel = destinationConfig.label;

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged: EthAccountChangeHandler = (accounts) => {
      if (!accounts.length) {
        setAccount('');
        setSigner(null);
        setTokenBalance(0n);
        setAllowance(0n);
        setQuote(null);
        return;
      }
      const nextAccount = accounts[0] ?? '';
      setAccount(nextAccount);
      if (nextAccount) {
        setRecipient(nextAccount);
      }
      setQuote(null);
      void refreshSigner();
    };

    const handleChainChanged: EthChainChangeHandler = (chainId) => {
      const parsed = Number.parseInt(chainId, 16);
      setNetworkChainId(Number.isNaN(parsed) ? null : parsed);
      setQuote(null);
      void refreshSigner();
    };

    window.ethereum.on?.('accountsChanged', handleAccountsChanged);
    window.ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  useEffect(() => {
    setQuote(null);
    setStatusMessage('');
    setErrorMessage('');
    setAllowance(0n);
    setTokenBalance(0n);
    setTokenDecimals(18);
  }, [direction]);

  useEffect(() => {
    const loadTokenData = async () => {
      if (!tokenContract || !account) return;
      try {
        const [decimals, balance, currentAllowance] = await Promise.all([
          tokenContract.decimals(),
          tokenContract.balanceOf(account),
          tokenContract.allowance(account, sourceOappAddress),
        ]);
        setTokenDecimals(Number(decimals));
        setTokenBalance(balance);
        setAllowance(currentAllowance);
      } catch (error) {
        setErrorMessage(`Failed to load token data: ${formatError(error)}`);
      }
    };

    loadTokenData();
  }, [tokenContract, account, sourceOappAddress]);

  useEffect(() => {
    if (account && !recipient) {
      setRecipient(account);
    }
  }, [account, recipient]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Web3 wallet not detected. Install MetaMask or a compatible wallet.');
      }

      const nextProvider = new BrowserProvider(window.ethereum, 'any');
      await nextProvider.send('eth_requestAccounts', []);
      const network = await nextProvider.getNetwork();
      const nextSigner = await nextProvider.getSigner();
      const nextAccount = await nextSigner.getAddress();

      setSigner(nextSigner);
      setAccount(nextAccount);
      setRecipient(nextAccount);
      setNetworkChainId(Number(network.chainId));
      setErrorMessage('');
      setStatusMessage('Wallet connected.');
    } catch (error) {
      setErrorMessage(`Connection failed: ${formatError(error)}`);
    }
  };

  const refreshSigner = async () => {
    if (!window.ethereum) return;
    try {
      const nextProvider = new BrowserProvider(window.ethereum, 'any');
      const network = await nextProvider.getNetwork();
      const accounts: string[] = await nextProvider.send('eth_accounts', []);

      if (!accounts.length) {
        setSigner(null);
        setAccount('');
        setNetworkChainId(Number(network.chainId));
        return;
      }

      const nextSigner = await nextProvider.getSigner();
      const nextAccount = accounts[0];

      setSigner(nextSigner);
      setAccount(nextAccount);
      setNetworkChainId(Number(network.chainId));
      if (nextAccount) {
        setRecipient((current) => current || nextAccount);
      }
    } catch (error) {
      setErrorMessage(`Failed to refresh signer: ${formatError(error)}`);
    }
  };

  const toggleDirection = () => {
    setDirection((prev) => (prev === 'SONIC_TO_BASE' ? 'BASE_TO_SONIC' : 'SONIC_TO_BASE'));
  };

  const switchToSourceNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sourceConfig.chainHex }],
      });
    } catch (error: any) {
      if (error?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: sourceConfig.chainHex,
                chainName: sourceConfig.label,
                nativeCurrency: sourceConfig.nativeCurrency,
                rpcUrls: sourceConfig.rpcUrls,
                blockExplorerUrls: sourceConfig.blockExplorerUrls,
              },
            ],
          });
        } catch (addError) {
          setErrorMessage(`Failed to add ${sourceConfig.label} network: ${formatError(addError)}`);
        }
      } else {
        setErrorMessage(`Failed to switch network: ${formatError(error)}`);
      }
    }
  };

  const refreshAllowance = async () => {
    if (!tokenContract || !account) return;
    try {
      const updatedAllowance = await tokenContract.allowance(account, sourceOappAddress);
      setAllowance(updatedAllowance);
    } catch (error) {
      setErrorMessage(`Unable to refresh allowance: ${formatError(error)}`);
    }
  };

  const handleApprove = async () => {
    if (!tokenContract || amountLD === 0n) {
      setErrorMessage(`Approval unavailable: configure the token contract for ${sourceLabel}.`);
      return;
    }
    setIsApproving(true);
    setErrorMessage('');
    setStatusMessage('Submitting approval...');

    try {
      const tx = await tokenContract.approve(sourceOappAddress, amountLD);
      await tx.wait();
      await refreshAllowance();
      setStatusMessage('Approval confirmed.');
    } catch (error) {
      if (isEthersError(error) && error.code === 'NETWORK_ERROR') {
        setErrorMessage(`Approval failed: wallet switched networks mid-transaction. Reconnect on ${sourceLabel} and try again.`);
      } else {
        setErrorMessage(`Approval failed: ${formatError(error)}`);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const buildSendParam = () => {
    if (!account || !isRecipientValid) {
      throw new Error('Recipient address is invalid.');
    }

    return {
      dstEid: activeRoute.dstEid,
      to: addressToBytes32(recipient),
      amountLD,
      minAmountLD,
      extraOptions: EXTRA_OPTIONS,
      composeMsg: '0x',
      oftCmd: '0x',
    };
  };

  const handleQuote = async () => {
    if (!oftContract || amountLD === 0n) return;
    if (!isOnSourceChain) {
      setErrorMessage(`Switch to ${sourceLabel} before requesting a quote.`);
      return;
    }
    setIsQuoting(true);
    setErrorMessage('');
    setStatusMessage('Requesting fee quote...');

    try {
      const sendParam = buildSendParam();
      const fee: MessagingFee = await oftContract.quoteSend(sendParam, false);
      setQuote(fee);
      setStatusMessage('Quote received.');
    } catch (error) {
      if (isEthersError(error) && error.code === 'CALL_EXCEPTION') {
        setErrorMessage('Quote failed: LayerZero endpoint rejected the request. Confirm the bridge configuration and try a smaller amount.');
      } else {
        setErrorMessage(`Quote failed: ${formatError(error)}`);
      }
      setQuote(null);
    } finally {
      setIsQuoting(false);
    }
  };

  const handleBridge = async () => {
    if (!oftContract || !account || amountLD === 0n) return;
    if (!isOnSourceChain) {
      setErrorMessage(`Switch to ${sourceLabel} to submit the bridge transaction.`);
      return;
    }
    if (!isTokenConfigured || !tokenContract) {
      setErrorMessage(`Configure the token contract for ${sourceLabel} before bridging this direction.`);
      return;
    }
    setIsBridging(true);
    setErrorMessage('');
    setStatusMessage('Preparing bridge transaction...');

    try {
      const sendParam = buildSendParam();
      const currentQuote = quote ?? (await oftContract.quoteSend(sendParam, false));
      const feeStruct = {
        nativeFee: currentQuote.nativeFee,
        lzTokenFee: currentQuote.lzTokenFee,
      };

      setStatusMessage(`Sending transaction on ${sourceLabel}...`);
      const tx = await oftContract.send(sendParam, feeStruct, account, {
        value: currentQuote.nativeFee,
      });

      setStatusMessage('Waiting for confirmation...');
      await tx.wait();

      setQuote(currentQuote);
      await refreshAllowance();
      setStatusMessage('Bridge transaction submitted. Track delivery on LayerZero explorer.');
    } catch (error) {
      if (isEthersError(error) && error.code === 'CALL_EXCEPTION') {
        setErrorMessage(`Bridge failed: transaction reverted on the ${sourceLabel} contract. Recheck fee quote, allowance, and LayerZero endpoint settings.`);
      } else {
        setErrorMessage(`Bridge failed: ${formatError(error)}`);
      }
    } finally {
      setIsBridging(false);
    }
  };

  const formattedBalance = useMemo(() => formatUnits(tokenBalance, tokenDecimals), [tokenBalance, tokenDecimals]);
  const formattedAllowance = useMemo(() => formatUnits(allowance, tokenDecimals), [allowance, tokenDecimals]);
  const formattedNativeFee = quote ? formatUnits(quote.nativeFee, 18) : null;
  const layerZeroScanUrl = useMemo(
    () => `https://mainnet.layerzeroscan.com/address/${sourceOappAddress}`,
    [sourceOappAddress]
  );

  const disableQuote = !signer || !oftContract || !isOnSourceChain || amountLD === 0n || !hasSufficientBalance || !isRecipientValid;
  const disableBridge = disableQuote || needsApproval || isApproving || isQuoting || !isTokenConfigured;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a href="/" className="flex items-center gap-3 text-white/90 transition hover:text-white">
            <img src="/AII.svg" alt="AII" className="h-10 w-10" />
            <div>
              <p className="font-heading text-lg tracking-wide">AII main</p>
              <p className="text-xs text-white/60">Return to main page</p>
            </div>
          </a>
          <nav className="flex items-center gap-6 text-sm text-white/70">
            <a href="/bridge" className="font-medium text-white">Bridge</a>
            <a
              href="https://www.layerzeroscan.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              LayerZero Explorer
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
        <section className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-1 text-sm text-cyan-200">
            <Zap className="mr-2 h-4 w-4" />
            {sourceLabel} → {destinationLabel} Token Bridge
          </div>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight md:text-5xl">
            Bridge {TOKEN_SYMBOL} from {sourceLabel} to {destinationLabel} with LayerZero OFT.
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Connect your wallet, verify allowances, and trigger a cross-chain transfer directly from the browser. Thirdweb integration is planned; this version uses ethers.js.
          </p>
        </section>

        <section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-500/10">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleDirection}
                  title={`Switch to ${destinationLabel} → ${sourceLabel}`}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 transition hover:bg-cyan-500/30"
                >
                  <ArrowRightLeft className="h-6 w-6 text-cyan-300" />
                </button>
                <div>
                  <h2 className="text-2xl font-semibold">Transfer Parameters</h2>
                  <p className="text-sm text-white/60">
                    Source: {sourceLabel} ({activeRoute.source.chainId}) → Destination: {destinationLabel} ({activeRoute.destination.chainId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={switchToSourceNetwork}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                <PlugZap className="h-4 w-4" />
                Switch to {sourceLabel}
              </button>
            </header>

            <div className="grid gap-6">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-cyan-300" />
                    <div>
                      <p className="text-sm text-white/60">Wallet</p>
                      <p className="text-base font-medium text-white/90">
                        {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    {account ? 'Reconnect' : 'Connect Wallet'}
                  </button>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-white/60">
                  <p>
                    Network: {networkChainId ?? '—'} {isOnSourceChain ? `(${sourceLabel})` : `(switch to ${sourceLabel})`}
                  </p>
                  <p>Balance: {tokenContract ? formattedBalance : '—'} {TOKEN_SYMBOL}</p>
                  <p>Allowance: {tokenContract ? formattedAllowance : '—'} {TOKEN_SYMBOL}</p>
                  <p>Source OAPP: {sourceOappAddress}</p>
                  <p>Destination OAPP: {destinationOappAddress}</p>
                  {!isTokenConfigured && (
                    <p className="text-amber-300">
                      Set the token address for {sourceLabel} (update `BASE_TOKEN_ADDRESS`) to enable approvals and balance checks.
                    </p>
                  )}
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/60">Recipient ({destinationLabel})</span>
                <input
                  type="text"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value.trim())}
                  placeholder="0x..."
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none"
                />
                {!isRecipientValid && (
                  <span className="text-sm text-red-400">Enter a valid address.</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/60">Amount ({TOKEN_SYMBOL})</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setQuote(null);
                  }}
                  placeholder="0.0"
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-cyan-500 focus:outline-none"
                />
                {!hasSufficientBalance && (
                  <span className="text-sm text-red-400">Not enough funds on {sourceLabel}.</span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-white/60">Slippage tolerance, %</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={normalizedSlippage}
                  onChange={(event) => {
                    setSlippagePercent(Number(event.target.value));
                    setQuote(null);
                  }}
                  className="w-32 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleQuote}
                  disabled={disableQuote || isQuoting}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isQuoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                  Get Fee Quote
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!needsApproval || isApproving || amountLD === 0n}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-5 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {needsApproval ? 'Approve' : 'Approved'}
                </button>
                <button
                  type="button"
                  onClick={handleBridge}
                  disabled={disableBridge || isBridging}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isBridging ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                  Bridge Tokens
                </button>
              </div>

              {!isTokenConfigured && (
                <p className="text-sm text-amber-300">
                  Provide the token contract address for {sourceLabel} (update `BASE_TOKEN_ADDRESS`) to enable approvals and bridging in this direction.
                </p>
              )}

              <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                <p>SendParam.amountLD: {amountLD.toString()}</p>
                <p>SendParam.minAmountLD: {minAmountLD.toString()}</p>
                <p>extraOptions: {EXTRA_OPTIONS}</p>
                <p>dstEid: {activeRoute.dstEid} • srcChainId: {sourceConfig.chainId}</p>
              </div>

              {statusMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-cyan-100">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="h-5 w-5" />
                Pre-flight checklist
              </h3>
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Make sure the wallet is connected to {sourceLabel} (chainId {sourceConfig.chainId}).
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  Verify token balance and allowance (when applicable) before triggering the bridge.
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />
                  LayerZero fees are paid in {sourceNativeSymbol}. Keep enough native balance for gas and messaging cost.
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />
                  Track the dispatched message via LayerZero Explorer using the transaction hash/GUID.
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80">
              <h3 className="mb-3 text-lg font-semibold">Summary</h3>
              <ul className="flex flex-col gap-3 text-sm text-white/70">
                <li className="flex items-start gap-2">
                  <ArrowRightLeft className="mt-0.5 h-4 w-4 text-cyan-300" />
                  Transfer: {amount || '0'} {TOKEN_SYMBOL} → {destinationLabel} recipient {recipient ? `${recipient.slice(0, 6)}…${recipient.slice(-4)}` : '—'}
                </li>
                <li className="flex items-start gap-2">
                  <PlugZap className="mt-0.5 h-4 w-4 text-cyan-300" />
                  LayerZero native fee: {formattedNativeFee ?? '—'} {sourceNativeSymbol}
                </li>
                <li className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-cyan-300" />
                  Keep native {sourceNativeSymbol} for gas and fees.
                </li>
              </ul>
              <a
                href={layerZeroScanUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200"
              >
                View {sourceLabel} OAPP on LayerZeroScan
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default BridgePage;
