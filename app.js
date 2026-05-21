// import the require modules
const express = require('express')
const path = require('path')

//set up the database connection
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

//expresss instance creation
const app = express()
app.use(express.json())

let database = null

//initialization the DB and start the server
const initializationAndStartServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB error: ${error.message}`)
    process.exit(1)
  }
}

initializationAndStartServer()

// write the tabels helper functions

const convertPlayerdetailsDbObjectToResponseObject = DbObject => ({
  playerId: DbObject.player_id,
  playerName: DbObject.player_name,
})

const convertMatchdetailsDbObjectToResponseObject = DbObject => ({
  matchId: DbObject.match_id,
  match: DbObject.match,
  year: DbObject.year,
})

const convertPlayerMatchScoreTableDbObjectToResponseObject = DbObject => ({
  playerMatchId: DbObject.player_match_id,
  playerId: DbObject.player_id,
  matchId: DbObject.match_id,
  score: DbObject.score,
  fours: DbObject.fours,
  sixes: DbObject.sixes,
})

// API 1 GET ALL player deails
app.get('/players/', async (request, response) => {
  const getAllPlayerDetailsQuery = `
      SELECT * 
      FROM player_details;`

  const playerDetails = await database.all(getAllPlayerDetailsQuery)
  response.send(playerDetails.map(convertPlayerdetailsDbObjectToResponseObject))
})

//API 2 GET all details with player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getAllPlayersWithId = `
      SELECT 
          player_id,
          player_name

      FROM player_details

      WHERE player_id = ${playerId};`

  const players = await database.get(getAllPlayersWithId)
  response.send(convertPlayerdetailsDbObjectToResponseObject(players))
})

//API 3 PUT (update) the players
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const updateAllNewPlayers = ` 
      UPDATE 
          player_details
        SET 
          player_name = '${playerName}'
      WHERE 
          player_id = ${playerId};`

  await database.run(updateAllNewPlayers)
  response.send('Player Details Updated')
})

//API 4 GET ALL match deatils
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getAllMatchDetailsQuery = ` 
      SELECT 
          match_id AS matchId,
          match,
          year

      FROM match_details
      WHERE match_id = ${matchId};`

  const matchDetails = await database.get(getAllMatchDetailsQuery)
  response.send(matchDetails)
})

//API 5 GET LIST OF ALL PLAYERS OF THE MATCHES
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getAllPlayersAndMatchesQuery = ` 
  
      SELECT 
          match_id AS matchId,
          match,
          year
          
      FROM player_match_score NATURAL JOIN match_details
      WHERE 
          player_id = ${playerId};`

  const matchIdDetails = await database.all(getAllPlayersAndMatchesQuery)
  response.send(matchIdDetails)
})

//API 6 GET players played the match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = ` 
      SELECT 
          player_match_score.player_id AS playerId,
          player_name AS playerName
      FROM 
          player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
          
      WHERE match_id = ${matchId};`

  const matchPlayers = await database.all(getMatchPlayersQuery)
  response.send(matchPlayers)
})

//API 7 GET all details
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getALLPlayersScoreQuery = ` 
      SELECT 
          player_details.player_id AS playerId,
          player_details.player_name AS playerName,
          SUM(player_match_score.score) AS totalScore,
          SUM(fours) AS totalFours,
          SUM(sixes) AS totalSixes
      FROM 
          player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
      WHERE 
          player_details.player_id = ${playerId};`

  const playersScores = await database.get(getALLPlayersScoreQuery)
  response.send(playersScores)
})

module.exports = app

/*
  git config --global user.email naikc8468@gmail.com
    git config --global user.name Chetannaik-9535
     git remote add origin https://github.com/Chetannaik-9535/Player-Match-Score.git
*/