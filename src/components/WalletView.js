import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Divider,
  Tooltip,
  List,
  Avatar,
  Spin,
  Tabs,
  Input,
  Button,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "../noImg.png";
import { CHAINS_CONFIG, MumbaiTestnet } from "../services/chains";
import { ethers } from "ethers";
import {
  getTokenBalances,
  getBalance,
  estimateGas,
  sendTransactionAlc,
  getTransactionReceipt,
} from "../services/alchemy";

function WalletView({
  wallet,
  setWallet,
  seedPhrase,
  setSeedPhrase,
  selectedChain,
}) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);
  const [gas, setGas] = useState(0);
  const [balance, setBalance] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [amountToSend, setAmountToSend] = useState(null);
  const [sendToAddress, setSendToAddress] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [hash, setHash] = useState(null);

  const setEstimateGas = useCallback(
    async (address) => {
      setGas(0);
      if (ethers.isAddress(address) && amountToSend) {
        const amount =
          selectedChain === MumbaiTestnet.hex
            ? amountToSend
            : ethers.parseEther(amountToSend.toString());
        const gas = await estimateGas(address, amount, selectedChain);
        setGas(gas);
      }
    },
    [amountToSend, selectedChain]
  );

  async function sendTransaction(to, amount) {
    setProcessing(true);
    try {
      const trxHash = await sendTransactionAlc(to, amount, selectedChain);
      if (!trxHash) {
        alert("Transaction Failed");
        throw new Error("Transaction Failed");
      } else {
        setHash(trxHash);
      }
      const receipt = await getTransactionReceipt(trxHash, selectedChain);
      if (Number(receipt?.status || 0) === 1) {
        alert("Transaction Succeeded");
      } else {
        alert("Transaction Failed or still pending");
      }
      setHash(null);
      setProcessing(false);
      setAmountToSend(null);
      setSendToAddress(null);
      setGas(0);
    } catch (err) {
      console.log(err);
      setHash(null);
      setProcessing(false);
      setAmountToSend(null);
      setSendToAddress(null);
      setGas(0);
    }
  }

  const processer = useMemo(() => {
    console.log(processing);
    return processing && <Spin />;
  }, [processing]);

  const hasher = useMemo(() => {
    console.log(hash);
    return (
      hash && (
        <Tooltip title={hash}>
          <p>Hover For Tx Hash</p>
        </Tooltip>
      )
    );
  }, [hash]);

  const items = [
    {
      key: "3",
      label: `Tokens`,
      children: (
        <>
          {tokens ? (
            <>
              <List
                bordered
                itemLayout="horizontal"
                dataSource={tokens}
                renderItem={(item, index) => (
                  <List.Item style={{ textAlign: "left" }}>
                    <List.Item.Meta
                      avatar={<Avatar src={item.logo || logo} />}
                      title={item.symbol}
                      description={item.name}
                    />
                    <div>
                      {(
                        Number(item.balance) /
                        10 ** Number(item.decimals)
                      ).toFixed(4)}{" "}
                      Tokens
                    </div>
                  </List.Item>
                )}
              />
            </>
          ) : (
            <>
              <span>You seem to not have any tokens yet</span>
            </>
          )}
        </>
      ),
    },
    {
      key: "1",
      label: `Transfer`,
      children: (
        <>
          <h3>Native Balance </h3>
          <h1>
            {balance.toFixed(4)} {CHAINS_CONFIG[selectedChain].ticker}
          </h1>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> To:</p>
            <Input
              value={sendToAddress}
              onChange={async (e) => {
                setSendToAddress(e.target.value);
                await setEstimateGas(e.target.value);
              }}
              placeholder="0x..."
            />
          </div>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> Amount:</p>
            <Input
              value={amountToSend}
              onChange={async (e) => {
                setAmountToSend(e.target.value);
                await setEstimateGas(sendToAddress);
              }}
              placeholder="Native tokens you wish to send..."
            />
          </div>
          {gas > 0 && <h3>Estimated Gas: {gas}</h3>}
          <Button
            style={{ width: "100%", marginTop: "20px", marginBottom: "20px" }}
            type="primary"
            onClick={() => sendTransaction(sendToAddress, amountToSend)}
          >
            Send Tokens
          </Button>

          {processer}
          {hasher}
        </>
      ),
    },
  ];

  useEffect(() => {
    // interval every second to get balance
    const interval = setInterval(async () => {
      const balance = await getBalance(wallet, selectedChain);
      setBalance(balance);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChain, wallet]);

  const getAccountTokens = useCallback(async () => {
    setFetching(true);

    const tokens = await getTokenBalances(wallet, selectedChain);

    if (tokens.length > 0) {
      setTokens(tokens);
    }

    setFetching(false);
  }, [selectedChain, wallet]);

  function logout() {
    setSeedPhrase(null);
    setWallet(null);
    setGas(0);
    setTokens(null);
    setBalance(0);
    navigate("/");
  }

  useEffect(() => {
    if (!wallet || !selectedChain) return;
    setGas(0);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, [getAccountTokens, selectedChain, wallet]);

  return (
    <>
      <div className="content">
        <div className="logoutButton" onClick={logout}>
          <LogoutOutlined />
        </div>
        <div className="walletName">Wallet</div>
        <Tooltip title={wallet}>
          <div>
            {wallet.slice(0, 4)}...{wallet.slice(38)}
          </div>
        </Tooltip>
        <Divider />
        {fetching ? (
          <Spin />
        ) : (
          <Tabs defaultActiveKey="1" items={items} className="walletView" />
        )}
      </div>
    </>
  );
}

export default WalletView;
