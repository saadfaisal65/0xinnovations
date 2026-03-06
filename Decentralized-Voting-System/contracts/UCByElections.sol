// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract UCByElections is ReentrancyGuard {
    // ===== ADMIN =====
    address public admin;
    string public electionTitle;

    // ===== STRUCTS =====
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    struct HistoricalElection {
        uint ucId;
        uint startTime;
        uint endTime;
        string winnerName;
        uint winningVotes;
    }

    struct UC {
        uint ucId; // 101, 102, ... 110
        uint startTime;
        uint endTime;
        uint candidatesCount;
        uint epoch;
        mapping(uint => Candidate) candidates; // local candidate mapping within UC
    }

    // ===== STORAGE =====
    mapping(uint => UC) public ucs;
    HistoricalElection[] public electionHistory;
    
    // ucId => epoch => voter => bool
    mapping(uint => mapping(uint => mapping(address => bool))) public hasVotedInUCEpoch;
    
    // Legacy mapping (kept for backwards compatibility conceptually, but not used for blocking votes in new epochs)
    mapping(uint => mapping(address => bool)) public hasVotedInUC;
    mapping(address => uint) public votedUC; // Tracks which UC the user voted in

    mapping(address => uint) public registeredUC;
    mapping(address => bool) public isRegistered;
    bool public paused;
    bool public registrationOpen = true;

    // ===== EVENTS =====
    event CandidatesAddedBulk(uint ucId, uint count);
    event ElectionStarted(uint ucId, uint startTime, uint endTime);
    event VoteCast(address voter, uint ucId, uint candidateId, uint epoch);
    event ElectionReset(uint ucId, uint newEpoch);

    // ===== MODIFIER =====
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    // ===== CONSTRUCTOR =====
    constructor(string memory _title) {
        admin = msg.sender;
        electionTitle = _title;
    }

    // ===== ADMIN / SECURITY FUNCTIONS =====
    function pause() public onlyAdmin {
        paused = true;
    }

    function unpause() public onlyAdmin {
        paused = false;
    }

    function setRegistrationOpen(bool _status) public onlyAdmin {
        registrationOpen = _status;
    }

    function registerVoter(address _voter, uint _ucId) public onlyAdmin whenNotPaused {
        require(!isRegistered[_voter], "Already registered");
        isRegistered[_voter] = true;
        registeredUC[_voter] = _ucId;
    }

    function registerVotersBulk(address[] calldata _voters, uint[] calldata _ucIds) public onlyAdmin whenNotPaused {
        require(_voters.length == _ucIds.length, "Arrays length mismatch");
        for (uint i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            // Skip if already registered to avoid reverting the entire transaction
            if (!isRegistered[voter]) {
                isRegistered[voter] = true;
                registeredUC[voter] = _ucIds[i];
            }
        }
    }

    // ===== BULK ADD CANDIDATES (1 Transaction Per UC) =====
    // Pass the UC ID (e.g., 101) and an array of candidate names.
    function addCandidatesBulk(uint _ucId, string[] memory _names) public onlyAdmin {
        require(ucs[_ucId].startTime == 0, "Election already started for this UC");
        require(_names.length > 0, "Must add at least 1 candidate");

        // Set the UC ID if it hasn't been set yet
        if (ucs[_ucId].ucId == 0) {
            ucs[_ucId].ucId = _ucId;
        }

        uint startIdx = ucs[_ucId].candidatesCount;
        for(uint i = 0; i < _names.length; i++) {
            uint newId = startIdx + i + 1;
            ucs[_ucId].candidates[newId] = Candidate(newId, _names[i], 0);
        }
        ucs[_ucId].candidatesCount += _names.length;

        emit CandidatesAddedBulk(_ucId, _names.length);
    }

    // ===== START / SCHEDULE ELECTION FOR SPECIFIC UC =====
    function startElectionForUC(uint _ucId, uint _startTime, uint _durationInSeconds) public onlyAdmin {
        require(ucs[_ucId].ucId == _ucId, "UC does not exist or has no candidates");
        require(ucs[_ucId].startTime == 0, "Election already started/scheduled for this UC");
        require(ucs[_ucId].candidatesCount > 1, "Add at least 2 candidates to start");
        require(_startTime >= block.timestamp - 5 minutes, "Start time cannot be in the past");

        ucs[_ucId].startTime = _startTime;
        ucs[_ucId].endTime = _startTime + _durationInSeconds;

        emit ElectionStarted(_ucId, ucs[_ucId].startTime, ucs[_ucId].endTime);
    }

    // ===== RESET ELECTION (ARCHIVE AND CLEAR) =====
    function resetElectionForUC(uint _ucId) public onlyAdmin {
        require(ucs[_ucId].endTime > 0, "No election to reset");
        
        (string memory winnerName, uint winningVotes) = getWinnerForUC(_ucId);
        
        // Push to history array
        electionHistory.push(HistoricalElection({
            ucId: _ucId,
            startTime: ucs[_ucId].startTime,
            endTime: ucs[_ucId].endTime,
            winnerName: winnerName,
            winningVotes: winningVotes
        }));

        // Reset UC for next epoch
        ucs[_ucId].startTime = 0;
        ucs[_ucId].endTime = 0;
        ucs[_ucId].candidatesCount = 0;
        ucs[_ucId].epoch++;

        emit ElectionReset(_ucId, ucs[_ucId].epoch);
    }

    // ===== VIEW INDIVIDUAL UC TIME & STATS =====
    function getUCTimeInfo(uint _ucId) public view returns(uint startTime, uint endTime) {
        return (ucs[_ucId].startTime, ucs[_ucId].endTime);
    }

    // ===== VIEW CANDIDATE FOR A UC =====
    function getCandidate(uint _ucId, uint _candidateId) public view returns (uint id, string memory name, uint voteCount) {
        Candidate memory c = ucs[_ucId].candidates[_candidateId];
        return (c.id, c.name, c.voteCount);
    }

    // ===== VOTE =====
    function vote(uint _ucId, uint _candidateId) public whenNotPaused nonReentrant {
        require(ucs[_ucId].startTime > 0, "Election not configured");
        require(block.timestamp >= ucs[_ucId].startTime, "Election not started for this UC");
        require(block.timestamp <= ucs[_ucId].endTime, "Election ended for this UC");
        require(isRegistered[msg.sender], "Not registered");
        require(registeredUC[msg.sender] == _ucId, "You are not assigned to this UC");
        require(!hasVotedInUCEpoch[_ucId][ucs[_ucId].epoch][msg.sender], "Already voted in this UC (this epoch)");
        require(_candidateId > 0 && _candidateId <= ucs[_ucId].candidatesCount, "Invalid candidate");

        hasVotedInUCEpoch[_ucId][ucs[_ucId].epoch][msg.sender] = true;
        hasVotedInUC[_ucId][msg.sender] = true; // For legacy UI checks
        votedUC[msg.sender] = _ucId;
        ucs[_ucId].candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _ucId, _candidateId, ucs[_ucId].epoch);
    }

    // ===== GET ALL CANDIDATES FOR A UC (Frontend Helper) =====
    function getAllCandidatesForUC(uint _ucId) public view returns (Candidate[] memory) {
        uint count = ucs[_ucId].candidatesCount;
        Candidate[] memory currentCandidates = new Candidate[](count);
        
        for (uint i = 1; i <= count; i++) {
            currentCandidates[i-1] = ucs[_ucId].candidates[i];
        }
        
        return currentCandidates;
    }

    // ===== VIEW WINNER OF A SPECIFIC UC =====
    function getWinnerForUC(uint _ucId) public view returns (string memory winnerName, uint winningVotes) {
        require(ucs[_ucId].endTime > 0, "Election not set");
        
        uint winningVoteCount = 0;
        uint winningCandidateId = 0;
        uint count = ucs[_ucId].candidatesCount;

        for (uint i = 1; i <= count; i++) {
            if (ucs[_ucId].candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = ucs[_ucId].candidates[i].voteCount;
                winningCandidateId = i;
            }
        }

        if(winningCandidateId == 0) return ("No Votes", 0);
        return (ucs[_ucId].candidates[winningCandidateId].name, winningVoteCount);
    }

    // ===== GET ALL HISTORY =====
    function getElectionHistory() public view returns (HistoricalElection[] memory) {
        return electionHistory;
    }
}
