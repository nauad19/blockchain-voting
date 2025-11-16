/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: {
    version: "0.8.11",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  defaultNetwork: "hardhat",

  networks: {
    // 🚀 Hardhat in-memory blockchain
    hardhat: {
      chainId: 31337, // MetaMask expects this ID
      accounts: {
        count: 20 // Increase if you want more test accounts
      }
    },

    // 🌐 Localhost network (when running "npx hardhat node")
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },

    // 🔗 Optional: connect to a real testnet (if needed)
    // sepolia: {
    //   url: API_URL,
    //   accounts: [`0x${PRIVATE_KEY}`]
    // }
  }
};
