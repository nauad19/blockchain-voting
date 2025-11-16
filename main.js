// =========================================================
// Global Variables
// =========================================================
let WALLET_CONNECTED = "";
let provider;
let signer;
let contractInstance;

// REPLACE THIS with your deployed contract address
let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ✅ ABI from Voting.json
let contractAbi = [
  {
    "inputs": [
      { "internalType": "string[]", "name": "_candidateNames", "type": "string[]" },
      { "internalType": "uint256", "name": "_durationInMinutes", "type": "uint256" }
    ],
    "stateMutability": "nonpayable", "type": "constructor"
  },
  { "inputs": [], "name": "getVotingStatus", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getRemainingTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getAllVotesOfCandiates", "outputs": [{ "components": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
    ], "internalType": "struct Voting.Candidate[]", "name": "", "type": "tuple[]" }],
    "stateMutability": "view", "type": "function"
  },
  { "inputs": [{ "internalType": "uint256", "name": "_candidateIndex", "type": "uint256" }], "name": "vote", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// =========================================================
// 🦊 Connect MetaMask
// =========================================================
const connectMetamask = async () => {
  const notifElement = document.getElementById("metamasknotification");

  try {
    if (!window.ethereum) {
      notifElement.innerHTML = "❌ MetaMask not detected!";
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    WALLET_CONNECTED = await signer.getAddress();
    contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    const shortAddr = WALLET_CONNECTED.slice(0, 6) + "..." + WALLET_CONNECTED.slice(-4);
    notifElement.innerHTML = `✅ Connected: ${shortAddr}`;

    await voteStatus();
    await getAllCandidates();

  } catch (error) {
    console.error("Connection failed:", error);
    notifElement.innerHTML = "⚠️ Connection failed. Ensure Hardhat node & contract are running.";
  }
};

// =========================================================
// 🗳️ Add Vote
// =========================================================
const addVote = async () => {
  const cand = document.getElementById("cand");
  try {
    if (!contractInstance) return (cand.innerHTML = "❌ Connect MetaMask first!");
    const voteIndex = parseInt(document.getElementById("vote").value);
    if (isNaN(voteIndex)) return (cand.innerHTML = "❌ Enter valid index number");

    cand.innerHTML = "⏳ Submitting your vote...";
    const tx = await contractInstance.vote(voteIndex);
    await tx.wait();
    cand.innerHTML = "✅ Vote successfully submitted!";
    await getAllCandidates();
  } catch (error) {
    console.error("Vote failed:", error);
    cand.innerHTML = "❌ Vote failed. You may have already voted or voting has ended.";
  }
};

// =========================================================
// 📊 Voting Status
// =========================================================
const voteStatus = async () => {
  const status = document.getElementById("status");
  const time = document.getElementById("time");

  try {
    const isOpen = await contractInstance.getVotingStatus();
    const remaining = await contractInstance.getRemainingTime();

    status.innerHTML = isOpen ? "🟢 Voting is OPEN" : "🔴 Voting is CLOSED";
    time.innerHTML = `⏱️ Time left: ${Math.floor(remaining / 60)}m ${remaining % 60}s`;
  } catch (error) {
    console.error("Status error:", error);
    status.innerHTML = "⚠️ Could not fetch voting status";
  }
};

// =========================================================
// 👥 Candidate List
// =========================================================
const getAllCandidates = async () => {
  const p3 = document.getElementById("p3");
  const table = document.getElementById("myTable");

  if (!table) {
    console.error("Table element not found.");
    return;
  }

  try {
    // Clear table
    while (table.rows.length > 1) table.deleteRow(1);

    const candidates = await contractInstance.getAllVotesOfCandiates();
    for (let i = 0; i < candidates.length; i++) {
      let row = table.insertRow();
      row.insertCell(0).innerHTML = i;
      row.insertCell(1).innerHTML = candidates[i].name;
      row.insertCell(2).innerHTML = candidates[i].voteCount.toString();
    }

    p3.innerHTML = "✅ Candidate list updated!";
  } catch (error) {
    console.error("Candidate list error:", error);
    p3.innerHTML = "❌ Failed to fetch candidate list.";
  }
};
