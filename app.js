if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session= require("express-session");
const MongoStore = require('connect-mongo');
const flash= require("connect-flash");
const passport= require("passport");
const LocalStrategy= require("passport-local");
const user= require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const { Session } = require("inspector");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust"; //dbUrl actvie so this line comment 
//const dbUrl=process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });
async function main() {
    await mongoose.connect(MONGO_URL);//dbUrl
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));



const store=MongoStore.create({
    mongoUrl:MONGO_URL,//dbUrl
    crypto: {
        secret: process.env.SECRET,

    },
    touchAfter: 24*3600,
});

store.on("error",() =>{
    console.log("ERROR IN MONGO SESSION STORE", err);

});


const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        express: Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,
        
    },
};

//app.get("/", (req, res) => {
    //res.send("Hi, I am root");
//});




app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(user.authenticate()));


passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser=req.user;
    next();
});

//app.get("/demouser", async(req,res) =>{
    //let fakeUser = new user({
        //email:"student@gemail.com",
        //username:"Delta-student"
    //});
    //let registeredUser=await user.register(fakeUser,"helloworld");
    //res.send(registeredUser);
//});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);


app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not Found!"));
});
app.use((err, req, res, next) => {
    let { statuscode = 500, message = "Something went wrong!" } = err;
    res.status(statuscode).render("error.ejs", { message });
    //res.status(statuscode).send(message);
});

app.listen(8080, () => {
    console.log("server listening to port 8080");
});