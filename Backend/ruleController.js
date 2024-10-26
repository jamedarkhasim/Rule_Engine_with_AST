const Rule = require('../models/Rule');
const { parseRuleString, combineNodes, evaluate,printTree } = require('../utils/ast');
// let count=0;

function generateRandomLetterString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters.charAt(randomIndex);
  }

  return result;
}


exports.createRule = async (req, res) => {
  try {
    const { ruleName, ruleString } = req.body;
    
    // Log the incoming request data to confirm it is received as expected
    // console.log('Received ruleName:', ruleName, 'and ruleString:', ruleString);
    
    if (!ruleName || !ruleString) {
      // console.log('Missing ruleName or ruleString');
      return res.status(400).json({ error: 'ruleName and ruleString are required' });
    }

    // console.log('Parsing ruleString...');
    const rootNode = parseRuleString(ruleString);
    
    // console.log('Creating new rule object...');
    const rule = new Rule({ ruleName, ruleAST: rootNode });
    
    // console.log('Saving rule to database...');
    await rule.save();
    
    // console.log('Printing rule tree...');
    printTree(rootNode);

    // Sending a structured JSON response
    res.status(201).json({ "Rule Name": ruleName });
    // console.log('Rule created successfully:', ruleName);
    
  } catch (error) {
    // Log the error message to help with debugging
    console.error('Error creating rule:', error.message);
    res.status(500).json({ error: error.message });
  }
};


exports.combineRules = async (req, res) => {
  try {
    const { rules ,op} = req.body;
    const ruleDocs = await Rule.find({ ruleName: { $in: rules } });
    if (ruleDocs.length === 0) {
      return res.status(404).json({ error: 'No matching rules found' });
    }
    const ruleASTs = ruleDocs.map(rule => rule.ruleAST);
    const combinedRootNode = combineNodes(ruleASTs,op);
    // Generate a 4-letter random string
    const randomString = generateRandomLetterString(4);
    const rule = new Rule({ ruleName: `combined${randomString}`, ruleAST: combinedRootNode });
    await rule.save();
    printTree(combinedRootNode);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.evaluateRule = async (req, res) => {
  try {
    const { ast, data } = req.body;
    const rule = await Rule.find({ruleName: ast});
     // Log the fetched rule
    //  printTree(rule[0].ruleAST);
    //  console.log('Fetched rule:',rule,ast); // Debug line

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    const result = evaluate(rule[0].ruleAST, data);
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};