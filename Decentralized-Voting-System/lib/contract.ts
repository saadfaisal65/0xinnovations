export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
    "function admin() view returns (address)",
    "function electionTitle() view returns (string)",
    "function paused() view returns (bool)",
    "function pause()",
    "function unpause()",
    "function registrationOpen() view returns (bool)",
    "function setRegistrationOpen(bool _status)",
    "function ucs(uint256) view returns (uint256 ucId, uint256 startTime, uint256 endTime, uint256 candidatesCount, uint256 epoch)",
    "function hasVotedInUCEpoch(uint256, uint256, address) view returns (bool)",
    "function isRegistered(address) view returns (bool)",
    "function registeredUC(address) view returns (uint256)",
    "function registerVoter(address _voter, uint256 _ucId)",
    "function registerVotersBulk(address[] _voters, uint256[] _ucIds)",
    "function addCandidatesBulk(uint256 _ucId, string[] _names)",
    "function startElectionForUC(uint256 _ucId, uint256 _startTime, uint256 _durationInSeconds)",
    "function resetElectionForUC(uint256 _ucId)",
    "function getUCTimeInfo(uint256 _ucId) view returns(uint256 startTime, uint256 endTime)",
    "function getCandidate(uint256 _ucId, uint256 _candidateId) view returns (uint256 id, string name, uint256 voteCount)",
    "function vote(uint256 _ucId, uint256 _candidateId)",
    "function getAllCandidatesForUC(uint256 _ucId) view returns (tuple(uint256 id, string name, uint256 voteCount)[])",
    "function getWinnerForUC(uint256 _ucId) view returns (string winnerName, uint256 winningVotes)",
    "function getElectionHistory() view returns (tuple(uint256 ucId, uint256 startTime, uint256 endTime, string winnerName, uint256 winningVotes)[])"
];
