require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser") 
const User = require("./models/user")
const { Suprsend, SubscriberListBroadcast } = require("@suprsend/node-sdk");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true})); 
app.use(express.static("public"));


mongoose.set('strictQuery', true);
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {useNewUrlParser: true});


const workspace_key = process.env.WORKSPACE_KEY;
const workspace_secret = process.env.WORKSPACE_SECRET;
const supr_client = new Suprsend(workspace_key, workspace_secret);


const subscriber_lists = supr_client.subscriber_lists.create({
    list_id: "stocksubscribers",
    list_name: "Stock Subscriber",
    list_description: "This list contains the information of the the all the ids which are subscribed to the stock market site "
});


app.get("/",(req,res)=>{
    res.render("homepage")
})

app.get("/createuser",(req,res)=>{
    res.render("userpage");
})

app.get("/broadcastinput",(req,res)=>{
  res.render("inputkey");
})

app.post("/add-user",(req,res)=>{
    const{usermail,username,userphone} = req.body;
    const newUser = new User({
        username: usermail,
        name : username,
        phone : userphone
    })
    User.findOne({username: newUser.username })
   .then(existingUser => {
    if (existingUser) {
      return res.send('<script>alert("Sorry, but the user already exists Please try again with different user name"); window.location.href = "/Add-Users";</script>');
    } else {
      newUser.save()
        .then(savedUser => {
           console.log("user saved");
        })
        .catch(err => {
          console.log(err);
        });
    }
  })
  .catch(err => {
    console.log(err);
  });

  const distinct_id = usermail; 
  const user = supr_client.user.get_instance(distinct_id)
  user.add_email(usermail)
  user.add_sms(userphone);

  const response = user.save()
  response.then((res) => console.log("response", res));
  
  const data = supr_client.subscriber_lists.add("stocksubscribers", [
     distinct_id
  ]);
  data.then((res) => console.log(res)).catch((err) => console.log(err));
  res.redirect("/");
})

const akey = process.env.AKEY;

app.post("/sendnotification", async (req, res) => {
  const {name,key} = req.body;
  console.log(name,key);
  if(key!="23eswar34qfeaw!!@#")res.send("wrong key");
  else{
  const request = require('request');
  const getData = (symbol) =>{ 
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${akey}`;
    return new Promise((resolve, reject) => {
      request.get({
        url: url,
        json: true,
        headers: { 'User-Agent': 'request' }
      }, (err, response, data) => {
        if (err) {
          reject(err);
        } else if (response.statusCode !== 200) {
          reject(new Error(`Status: ${response.statusCode}`));
        } else {
          const firstData = data['Time Series (Daily)'][Object.keys(data['Time Series (Daily)'])[0]];
          resolve(firstData);
        }
      });
    });
  };
  
  try {
    const symbol = ["IBM","TSCO.LON","SHOP.TRT","GPV.TRV","DAI.DEX","RELIANCE.BSE"]
    const data1 = await getData("IBM");
    const data2 = await getData("TSCO.LON");
    const data3 = await getData("SHOP.TRT");
    const data4 = await getData("GPV.TRV");
    const data5 = await getData("DAI.DEX");
    const broadcast_body = {
      list_id: "stocksubscribers",
      template: "broadcast-message",
      notification_category: "transactional",
      channels: ["email","whatsapp"],
      data:{
       'v1': {
        'Open': data1['1. open'],
        'Close': data1['4. close'],
        'High': data1['2. high'],
        'Low': data1['3. low'],
        'Split Coefficient': data1['8. split coefficient']
      },
      'v2': {
        'Open': data2['1. open'],
        'Close': data2['4. close'],
        'High': data2['2. high'],
        'Low': data2['3. low'],
        'Split Coefficient': data2['8. split coefficient']
      },
      'v3': {
        'Open': data3['1. open'],
        'Close': data3['4. close'],
        'High': data3['2. high'],
        'Low': data3['3. low'],
        'Split Coefficient': data3['8. split coefficient']
      },
      'v4': {
        'Open': data4['1. open'],
        'Close': data4['4. close'],
        'High': data4['2. high'],
        'Low': data4['3. low'],
        'Split Coefficient': data4['8. split coefficient']
      },
      'v5': {
        'Open': data5['1. open'],
        'Close': data5['4. close'],
        'High': data5['2. high'],
        'Low': data5['3. low'],
        'Split Coefficient': data5['8. split coefficient']
      }
      }
    }  
    const inst = new SubscriberListBroadcast(broadcast_body, brand_id="stockbroadcast");
    const data = supr_client.subscriber_lists.broadcast(inst);
    data.then((res) => console.log(res)).catch((err) => console.log(err));
    res.render("notificationsent");
  } catch (error) {
    console.log('Error:', error);
  }
}
});

app.listen(3000,()=>{
    console.log("server started on port 3000");
})
