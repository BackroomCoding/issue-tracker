import express from 'express'
import auth from '../middleware/auth.js';
import {check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import Fix from '../models/Fix.js';

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const fixes = await Fix.find().sort({date: -1});
        res.json(fixes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }

})

router.get('/user', auth ,async (req, res) => {
    try {
        const fixes = await Fix.find({user: req.user.id}).sort({date: -1});
        res.json(fixes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }

})

router.get('/issue/:id', async (req, res) => {
    try {
        const fix = await Fix.findOne({issue: req.params.id})
        res.json(fix);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
})

router.get('/user', auth ,async (req, res) => {
    try {

        const fixes = await Fix.find({user: req.user.id}).sort({date: -1});
        res.json(fixes);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }

})

router.post('/',[auth,[
    check('solution', 'solution is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }
    const {issue, solution } = req.body;

    const issueForFixCheck = await Fix.findOne({issue})

    if(issueForFixCheck) {
        return res.status(400).json({msg:"Fix already exists for this issue"})
    }
    const issueCheck = await Issue.findById(issue);
    if(!issueCheck) {
        return res.status(400).json({msg:"Invalid Issue ID"});
    }

     
    try {
        const newFix = new Fix({
            issue:mongoose.Types.ObjectId(issue),
            solution,
            date:Date.now(),
            user: req.user.id,
            userName: req.user.user   
        });
    
        const fix = await newFix.save(); 
        res.json(fix);
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");

    }

})

//@route      PUT api/fixes/:id
//@desc       edit a fix
//@access     private


router.put('/:id',auth , async (req, res) => {
    const {solution} = req.body; 

    // Create contact obj

    const fixFields = {}
    if(solution) fixFields.solution = solution;
 

    try {
        let fix = await Fix.findById(req.params.id);
        console.log(req.params.id);
        if(!fix) {
            return res.status(404).json({msg :'fix not found'});
        }

        if(fix.user.toString() !== req.user.id && !req.user.admin) {
            return res.status(401).json({msg: 'unauthorized Request'});
        }

        fix = await Fix.findByIdAndUpdate(req.params.id,
            {$set:fixFields},
            {new: true});


        res.json(fix);

         
    } catch (error) {
        console.error(error.message);
        res.status.send('Server Error');
    }


});

router.delete('/:id',auth, async (req, res) => {
    try {
        let fix = await Fix.findById(req.params.id);
        if(!fix) {
            return res.status(404).json({msg:'Fix not found'});
        }

        let issue = await Issue.findById(fix.issue);
        
        if(fix.user.toString() !== req.user.id && issue.user.toString() !== req.user.id  && !req.user.admin) {
            return res.status(401).json({msg: 'unauthorized Request'});
        }

        fix = await Fix.findByIdAndRemove(req.params.id);


        res.json(fix);

         
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }

})
export default router;