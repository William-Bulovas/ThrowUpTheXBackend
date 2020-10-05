import express = require('express');
import cors = require('cors');
import bodyParser =  require('body-parser');
import compression = require('compression');
import awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
import { DraftResultDao } from './dao/draftResultDao';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { StandingsDao } from './dao/standingsDao';

const app = express();
const router = express.Router();

router.use(compression());
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(awsServerlessExpressMiddleware.eventContext());

const documentClient = new DocumentClient;

const draftResultsDao = new DraftResultDao(documentClient);
const standingDao = new StandingsDao(documentClient);

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

app.get('/historicalStanding', async (req, res) => {
    res.json(await standingDao.getHistoricalStandings());
});

export default app;