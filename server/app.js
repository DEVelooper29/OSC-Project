const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const validator = require("validator");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
const requireAuth = require("./middleware/requireAuth");
const { createTokens } = require("./JWT");
const mongoose = require("mongoose");
require("./models/UserSchema");
require("./models/QuestionSchema");
app.use(express.json());
app.use(cookieParser());

// const corsOpts = {
//   origin: "*",

//   methods: ["GET", "POST"],

//   allowedHeaders: ["Content-Type"],
// };
// app.use(cors(corsOpts));


app.use(cors())
// const cors = require('cors');
const corsOptions ={
    origin:'*', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

const mongoUrl =
  "mongodb+srv://devbbhuva:devbhuva%4029@cluster0.r0niqxx.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to Cloud");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(3000, () => {
  console.log("Listening to port:3000");
});

const User = mongoose.model("UserInfo");
const Question = mongoose.model("Question");

app.post("/profile", (req, res) => {
  res.status(200).json("profile");
});
app.post("/register", async (req, res) => {
  const { username, email, password, confirmpassword } = req.body;
  if (!username || !email || !password || !confirmpassword) {
    return res.status(400).json("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json("Please enter a valid email");
  }
  if (!validator.isStrongPassword(password)) {
    return res.status(400).json("Enter a strong password");
  }
  if (password !== confirmpassword) {
    return res.status(400).json("Passwords do not match");
  }
  const user = await User.findOne({ username });
  if (user) {
    return res.status(400).json("Username already in use");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const registeredUser = await User.create({
    username,
    email,
    password: hash,
  });
  try {
    const accessToken = await createTokens(registeredUser);
    //creating a cookie
    // res.cookie("access-token",accessToken,{
    //   maxAge: 60*60*24*3*1000,
    //   httpOnly:true
    // })
    console.log(accessToken);
    console.log("inside");
    return res.status(200).json({ registeredUser: username, accessToken });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
  // }
});
//   }
// })
app.post("/", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!username || !password) {
    return res.status(400).json("All fields must be filled");
  } else if (!user) {
    return res.status(400).json("You're not registered with us :) ");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json("Credentials Incorrect");
  }
  try {
    const accessToken = createTokens(user);
    return res.status(200).json({ registeredUser: user.username, accessToken });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({ error: error.message });
  }
});



app.use(requireAuth);

app.post("/createquiz", async (req, res) => {
  const { adminName, questionArray, room, timer } = req.body;
  console.log(questionArray);
  try {
    console.log("encounterd");
    await Question.create({
      adminName: adminName,
      questionArray: questionArray,
      room: room,
      timer: timer,
    });
    console.log("New data-set added");
    return res.json({ status: "ok" });
  } catch (err) {
    console.log("err encountered");
    console.log(err);
    res.send({ status: "error" });
  }
});

app.post("/scorecard", async (req, res) => {
  const { score, username, room } = req.body;
  console.log(req.body);
  const questionSet = await Question.updateOne(
    { room: room },
    { $push: { scoreArray: { username: username, score: score } } }
  );
  if (questionSet) {
    console.log("Room found ");
  } else {
    console.log("Room not found ");
  }
});
app.post("/scorecard", async (req, res) => {
  const { score, username, room } = req.body;
  console.log(req.body);
  const questionSet = await Question.updateOne(
    { room: room },
    { $push: { scoreArray: { username: username, score: score } } }
  );
  if (questionSet) {
    console.log("Room found ");
  } else {
    console.log("Room not found ");
  }
});

app.post("/result", async (req, res) => {
  console.log(req.method);
  const { score1, username } = req.body;
  console.log(req.body);
  const questionSet = await User.updateOne(
    { username: username },
    {
      $push: { score_arr: { indiv_score: score1 } },
      $inc: { totalscore: score1 },
    }
  );
  if (questionSet) {
    console.log("Room found ");
  } else {
    console.log("Room not found ");
  }
});

app.get("/quiz1", async (req, res) => {
  console.log(req.headers.room);
  const { room } = req.headers;
  const questions = await Question.findOne({ room });
  console.log(questions);
  return res.json({ questions });
});

app.get("/viewprofile", async (req, res) => {
  //console.log(req.headers.user);
  const { username } = req.headers;
  const personalscore = await User.findOne({ username });
  console.log(personalscore);
  return res.json({ personalscore });
});

app.get("/profile", async (req, res) => {
  //console.log(req.headers.user);
  const { username } = req.headers;
  const info = await User.findOne({ username });
  //console.log(info);
  return res.json({ info });
});

app.get("/ranklist", async (req, res) => {
  console.log(req.headers.room);
  const { room } = req.headers;
  const rank = await Question.findOne({ room });
  console.log(rank);
  return res.json({ rank });
});

app.post("/joinroom", async (req, res) => {
  const { room } = req.body;
  console.log(room);
  const user = await Question.findOne({ room });
  if (user) {
    console.log("Room exists");
    return res.json(1);
  } else {
    console.log("Invalid Room code");
    return res.json(-1);
  }
});
