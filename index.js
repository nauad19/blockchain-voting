// =========================================================
// 🌐 Global Variables
// =========================================================
let WALLET_CONNECTED = "";
let provider;
let signer;
let contractInstance;

// ⚠️ Paste your deployed contract address here:
let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ✅ Full ABI from Voting.json
let contractAbi = [
  {
    "inputs": [
      { "internalType": "string[]", "name": "_candidateNames", "type": "string[]" },
      { "internalType": "uint256", "name": "_durationInMinutes", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "candidateIndex", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "addedBy", "type": "address" }
    ],
    "name": "CandidateAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "candidateIndex", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "newVoteCount", "type": "uint256" }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_name", "type": "string" }],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_candidateIndex", "type": "uint256" }],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  { "inputs": [], "name": "getVotingStatus", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getRemainingTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  {
    "inputs": [],
    "name": "getAllVotesOfCandiates",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
        ],
        "internalType": "struct Voting.Candidate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// =========================================================
// 🦊 Connect MetaMask
// =========================================================
const connectMetamask = async () => {
  const notifElement = document.getElementById("metamasknotification");

  if (typeof window.ethereum === "undefined") {
    notifElement.innerHTML = "❌ MetaMask not installed. Please install it.";
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    WALLET_CONNECTED = await signer.getAddress();

    contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);

    const shortAddr = `${WALLET_CONNECTED.substring(0, 6)}...${WALLET_CONNECTED.slice(-4)}`;
    notifElement.innerHTML = `✅ Connected: <b>${shortAddr}</b>`;

    await voteStatus();
    await getAllCandidates();
  } catch (error) {
    console.error("Connection failed:", error);
    notifElement.innerHTML = "⚠️ Connection failed. Ensure Hardhat node is running.";
  }
};

// =========================================================
// 🗳️ Add Vote
// =========================================================
const addVote = async () => {
  const cand = document.getElementById("cand");
  if (!contractInstance) return (cand.innerHTML = "Please connect MetaMask first!");

  try {
    const nameInput = document.getElementById("vote");
    const index = parseInt(nameInput.value);
    if (isNaN(index) || index < 0) return (cand.innerHTML = "⚠️ Enter valid candidate index.");

    cand.innerHTML = "⏳ Submitting vote...";
    const tx = await contractInstance.vote(index);
    await tx.wait();
    cand.innerHTML = "✅ Vote submitted successfully!";
    await getAllCandidates();
  } catch (err) {
    console.error(err);
    cand.innerHTML = "❌ Vote failed. Maybe voting ended or already voted.";
  }
};

// =========================================================
// 👤 Add Candidate (Owner Only)
// =========================================================
const addCandidate = async () => {
  const status = document.getElementById("addCandidateStatus");
  const nameInput = document.getElementById("candidateName");

  if (!contractInstance) {
    status.innerHTML = "⚠️ Connect MetaMask first.";
    return;
  }

  const name = nameInput.value.trim();
  if (!name) {
    status.innerHTML = "⚠️ Enter a valid candidate name.";
    return;
  }

  try {
    status.innerHTML = `⏳ Adding "${name}"...`;
    const tx = await contractInstance.addCandidate(name);
    await tx.wait();
    status.innerHTML = `✅ "${name}" added successfully!`;
    nameInput.value = "";
    await getAllCandidates();
  } catch (error) {
    console.error(error);
    if (error.code === "CALL_EXCEPTION") status.innerHTML = "❌ Only the owner can add candidates.";
    else status.innerHTML = "❌ Failed to add candidate.";
  }
};

// =========================================================
// 🛑 End Voting (Owner Only)
// =========================================================
const endVoting = async () => {
  const msg = document.getElementById("endVotingStatus");
  if (!contractInstance) return (msg.innerHTML = "⚠️ Connect MetaMask first.");

  try {
    msg.innerHTML = "⏳ Ending voting session...";
    const tx = await contractInstance.endVoting();
    await tx.wait();
    msg.innerHTML = "✅ Voting ended successfully!";
    await voteStatus();
  } catch (err) {
    console.error(err);
    msg.innerHTML = "❌ Only the owner can end voting.";
  }
};

// =========================================================
// 📊 Voting Status
// =========================================================
const voteStatus = async () => {
  const status = document.getElementById("status");
  const time = document.getElementById("time");
  try {
    const active = await contractInstance.getVotingStatus();
    const seconds = Number(await contractInstance.getRemainingTime());
    status.innerHTML = active ? "🟢 Voting is active" : "🔴 Voting is closed";
    time.innerHTML = seconds > 0 ? `🕒 Time left: ${Math.floor(seconds / 60)}m ${seconds % 60}s` : "🕒 Time ended";
  } catch (err) {
    console.error(err);
    status.innerHTML = "⚠️ Unable to fetch status.";
  }
};

// =========================================================
// 👥 Get Candidates
// =========================================================
const getAllCandidates = async () => {
  const p3 = document.getElementById("p3");
  const table = document.getElementById("myTable");
  while (table.rows.length > 1) table.deleteRow(1);

  try {
    const candidates = await contractInstance.getAllVotesOfCandiates();
    for (let i = 0; i < candidates.length; i++) {
      const row = table.insertRow();
      row.insertCell(0).innerText = i;
      row.insertCell(1).innerText = candidates[i].name;
      row.insertCell(2).innerText = candidates[i].voteCount.toString();
    }
    p3.innerHTML = "✅ Candidate list updated.";
  } catch (err) {
    console.error(err);
    p3.innerHTML = "❌ Could not load candidates.";
  }
};
