// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    address public owner;
    mapping(address => bool) public voters;

    uint256 public votingStart;
    uint256 public votingEnd;

    uint256 private constant TIME_UNIT = 1 minutes;

    event CandidateAdded(uint256 candidateIndex, string name, address indexed addedBy);
    event Voted(address indexed voter, uint256 candidateIndex, uint256 newVoteCount);

    constructor(string[] memory _candidateNames, uint256 _durationInMinutes) {
        require(_candidateNames.length > 0, "Must include initial candidates.");

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name: _candidateNames[i],
                voteCount: 0
            }));
        }

        owner = msg.sender;
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * TIME_UNIT);
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only the contract owner can call this function.");
        _;
    }

    modifier onlyDuringVoting {
        require(block.timestamp < votingEnd, "Voting period has ended.");
        _;
    }

    function addCandidate(string memory _name) public onlyOwner onlyDuringVoting {
        require(bytes(_name).length > 0, "Candidate name cannot be empty.");

        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));

        emit CandidateAdded(candidates.length - 1, _name, msg.sender);
    }

    function vote(uint256 _candidateIndex) public onlyDuringVoting {
        require(!voters[msg.sender], "You have already voted.");
        require(_candidateIndex < candidates.length, "Invalid candidate index.");

        candidates[_candidateIndex].voteCount++;
        voters[msg.sender] = true;

        emit Voted(msg.sender, _candidateIndex, candidates[_candidateIndex].voteCount);
    }

    function getCandidate(uint256 _candidateIndex) public view returns (string memory, uint256) {
        require(_candidateIndex < candidates.length, "Invalid candidate index.");
        Candidate storage candidate = candidates[_candidateIndex];
        return (candidate.name, candidate.voteCount);
    }

    function getAllVotesOfCandiates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getVotingStatus() public view returns (bool) {
        return (block.timestamp < votingEnd);
    }

    function getRemainingTime() public view returns (uint256) {
        if (block.timestamp >= votingEnd) {
            return 0;
        }
        return votingEnd - block.timestamp;
    }
}
