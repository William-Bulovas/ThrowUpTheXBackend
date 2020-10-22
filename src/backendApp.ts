import express = require('express');
import cors = require('cors');
import bodyParser =  require('body-parser');
import compression = require('compression');
import awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
import { DraftResultDao } from './dao/draftResultDao';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { StandingsDao } from './dao/standingsDao';
import { MatchupDao } from './dao/matchupDao';

const app = express();
const router = express.Router();

router.use(compression({threshold:0}));
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(awsServerlessExpressMiddleware.eventContext());

const documentClient = new DocumentClient;

const draftResultsDao = new DraftResultDao(documentClient);
const standingDao = new StandingsDao(documentClient);
const matchupDao = new MatchupDao(documentClient);

app.use('/', router);

app.get('/draft/:year/:manager?', async (req, res) => {
    console.log('Year : ' + req.params.year);

    if (req.params.manager) {
        res.json(await draftResultsDao.getDraftResultForPlayerAndYear(req.params.manager, req.params.year));

        return;
    }

    res.json(await draftResultsDao.getDraftResultForYear(req.params.year));
});

app.get('/standing/:year', async (req, res) => {
    res.json(await standingDao.getStandingsForYear(req.params.year));
});

app.get('/standingForManager/:manager', async (req, res) => {
    res.json(await standingDao.getStandingsForManager(req.params.manager));
});

app.get('/historicalStanding', async (req, res) => {
    res.json(await standingDao.getHistoricalStandings());
});

app.get('/matchup/:managerIdA/:managerIdB', async (req, res) => {
    res.json(await matchupDao.getMatchupData(req.params.managerIdA, req.params.managerIdB));
});

app.get('/matchupDetail/:managerIdA/:managerIdB/:year/:week', async (req, res) => {
    res.json(await matchupDao.getMatchupDetail(
        req.params.managerIdA, 
        req.params.managerIdB, 
        parseInt(req.params.week),
        req.params.year))
});

export default app;