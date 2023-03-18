const Buyer = require('../models/buyer');
const Order = require('../models/order');
const Stock = require('../models/stock');
const Combo = require('../models/combo');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = 'sk_test_51MiaJ7SJJiuoYq54NMKiZXy8dvqHXgxSfgc9FUA59HZbCmEVt7oNajhu2xWp6fqg49ui3TEknYt2cNlC5MpJM9oy00ks5zG07g';
const Stripe = require('stripe')(secretKey);

//  Auth
exports.login = (req, res, next) => {
    let buyerContact = req.body.buyerContact;
    let buyerPass = req.body.buyerPass;

    if (!buyerContact || !buyerPass) {
        res.status(400)
        throw new Error("Empty Email or Password");
    }

    Buyer.findOne({ buyerContact })
        .then(buyerCont => {
            if (!buyerCont) {
                res.status(401);
                throw new Error("buyer contact not found");
            }
            bcrypt.compare(buyerPass, buyerCont.buyerPass)
                .then(compareVal => {
                    if ((compareVal)) {
                        accessToken = jwt.sign({
                            Buyer: {
                                buyerContact: buyerCont.buyerContact,
                                buyerName: buyerCont.buyerName
                            }
                        }, "kisaanLink",
                            { expiresIn: "1440m" }
                        );
                        res.status(200).json({ type: "Buyer", accessToken });
                    }
                    else {
                        res.status(401);
                        throw new Error("Email or Password not matched")
                    }
                })
        })
}

exports.signup = (req, res, next) => {
    let buyerName = req.body.buyerName;
    let buyerContact = req.body.buyerContact;
    let buyerLocation = req.body.buyerLocation;
    let buyerPass = req.body.buyerPass;

    if (!buyerName || !buyerContact || !buyerLocation || !buyerPass) {
        res.status(400);
        throw new Error("All fields are mandatory");
    }

    Buyer.findOne({ buyerContact })
        .then(exists => {
            if (exists) {
                res.status(400);
                throw new Error("User already exists");
            }
        })

    let hashedPass;

    bcrypt.hash(buyerPass, 10)
        .then((hashedPass) => {
            const buyer = new Buyer({ buyerName: buyerName, buyerContact: buyerContact, buyerLocation: buyerLocation, buyerPass: hashedPass });
            buyer
                .save()
                .then(() => {
                    res.status(202).json({ mess: "Sign up succesful" });
                })
                .catch((err) => { console.log(err) })
        })

}

exports.currentUser = (req, res, next) => {
    res.json(req.Buyer);
}

exports.order = (req, res, next) => {
    let buyerContact = req.Buyer.buyerContact;
    let orderTotalPrice = req.body.orderTotalPrice;
    let orderItems = req.body.orderItems;
    let token = req.body.token;
    let stripeAmt = req.body.stripeAmt;

    // console.log(token);

    // CODE FOR PAYMENT ACTIVITY CREATION ON DASHBOARD (NOT WORKING) ..
    // TO SEE PAYMENT ACTIVITY GOT TO STRIPE DASHBOARD AND THEN TO DEVELOPER AND THE CHECK LOGS
    // Stripe.charges.create({
    //     source: token.id,
    //     amount: stripeAmt,
    //     currency: 'INR'
    //     }) 

        if(token){
    const order = new Order({ buyerContact: buyerContact, orderTotalPrice: orderTotalPrice, orderItems: orderItems });
    order
        .save()
        .then(() => {
            res.status(202).json({ mess: "Order placed successfully" });
        })
        .catch((err) => { console.log(err) })}
        else{
            res.json({mess: "Payment unsuccessful"})
        }
}

exports.displayProducts = (req, res, next) => {
    Stock.find().limit(20)
    .then((stock) => { res.status(200).json(stock) })
}

exports.displayType = (req, res, next) =>{
    Stock.find({produceCategory: req.params.type}).limit(20)
    .then((stock)=> {res.status(200).json(stock)})
}


exports.displayProduct = (req, res, next) =>{
    Stock.find({_id: req.params.id})
    .then((stock)=> {res.status(200).json(stock)})
}

exports.comboProducts = (req, res, next) => {
Combo.countDocuments()
.then( (countOfCombos)=>{
    if(countOfCombos < 3){
    let products = [];
    Stock.find().limit(4)
        .then((stock) => {
            // console.log(stock);
            for (stockObjs of stock) {
                let product = {
                    produceType: stockObjs.produceType,
                    produceCategory: stockObjs.produceCategory,
                    produceQuantity: Number.parseInt(stockObjs.produceQuantity),
                    producePerishability: Number.parseInt(stockObjs.producePerishability),
                    produceDesiredPrice: Number.parseInt(stockObjs.produceDesiredPrice)
                }

                products.push(product);
            }
            let combos = [];
const max_life = 16;
const max_price = 13000;
let stock_zero = false;

while (!stock_zero) {
  for (let units = 2; units < 5; units++) {
    for (let i = 0; i < products.length - 1; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const combo = [products[i], products[j]];
        if (combo.every(prod => prod.produceQuantity > 0)) {
          combo.sort((a, b) => a.producePerishability - b.producePerishability);
          const sum_price = combo.reduce((acc, prod) => acc + prod.produceDesiredPrice, 0);
          const combo_price = sum_price - ((sum_price / combo.length) * 0.2);
          const combo_life = Math.min(...combo.map(prod => prod.producePerishability));
          if (combo_price <= max_price && combo_life <= max_life) {
            combos.push([combo.map(prod => prod.produceType), combo_price, combo_life]);

            combo.forEach(prod => {
              prod.produceQuantity--;
              if (prod.produceQuantity === 0) {
                stock_zero = true;
              }
            });

            if (stock_zero) {
              break;
            }
          }
        }
      }
      if (stock_zero) {
        break;
      }
    }
    if (stock_zero) {
      break;
    }
  }
}

combos.sort((a, b) => a[2] - b[2]);

// combos.forEach(combo => {
//   // console.log(`${combo[0].join(', ')} for Rs.${combo[1]} (Shelf Life: ${combo[2]})`);
// });

class comboClass {
    
  constructor(comboItems, comboPrice, comboLife, comboQty){
    this.comboItems=comboItems;
    this.comboPrice=comboPrice;
    this.comboLife=comboLife;
    this.comboQty=comboQty;
  }
}

let finalCombos = [];

while(combos != null){
  comboToSearch=combos[0];
//   console.log(comboToSearch)
  arrCounter=1;
  comboQtyCounter=1;
  // console.log(comboToSearch[0], combos[arrCounter][0])
  while(arrCounter<combos.length){
    if(comboToSearch.toString() == combos[arrCounter].toString()){
       // console.log(comboToSearch[0], combos[arrCounter][0])
      combos.splice(arrCounter, 1);
      arrCounter--;
      // console.log(combos)
      comboQtyCounter++;
      // console.log(comboQtyCounter);
    }
    arrCounter++;
    // console.log(arrCounter);
  }

  
  let comboObj = new comboClass(combos[0][0].toString(), comboToSearch[1].toString(), comboToSearch[2].toString(), comboQtyCounter.toString());
        
  finalCombos.push(comboObj);
  // console.log(finalCombos);
  combos.shift();
  // console.log(combos)
  if(combos.length === 0 ){
      break
  }
}
console.log(finalCombos);

for(indCombo of finalCombos){
const combo = new Combo({ comboName: indCombo.comboItems, comboQty: indCombo.comboQty, comboPrice: indCombo.comboPrice, comboPerishability: indCombo.comboLife});
            combo
                .save()
                .catch((err)=>{res.status(500).json("Combos not available, DB error detected!")});
}

res.status(202).json(finalCombos);

console.log();
console.log("updated produceQuantity: ");
products.forEach(product => {
  console.log(`${product.produceType}: ${product.produceQuantity}`);
});
            // console.log(products);
        })
    }
    else{
        Combo.find()
        .then((combos)=>{res.json(combos)});
    }

})
}

exports.comboBringSingle = (req, res, next)=>{

    Combo.find({_id: req.params.id})
    .then((combos)=>{
        // console.log(combos);
        res.status(202).json(combos)
    })

}