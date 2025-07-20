import express from 'express';
const router = express.Router();

import userRoute from './user.routes';
import bankRoute from './bank.routes';
import loanApplicationRoute from './loanApplication.routes';
import loanCriteriaRoute from './loanCriteria.routes'; // Import loanCriteria routes
import otherRoute from './other.routes';
import uploadRoute from './upload.routes';
/**
 * Function contains Application routes
 *
 * @returns router
 */
const routes = () => {
    router.get('/', (req, res) => {
        res.json('Welcome');
    });
    router.use('/users', userRoute);
    router.use('/banks', bankRoute);           // Mount bank routes
    router.use('/loans', loanApplicationRoute); // Mount loan application routes
    router.use('/criteria', loanCriteriaRoute);    // Mount loan criteria routes
    router.use('/other', otherRoute);
    router.use('/api', uploadRoute)

    return router;
};

export default routes;
