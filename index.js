import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const URL_link = "https://www.thecocktaildb.com/api/json/v1/1/";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));


app.get("/", async (req,res) => {
    const result = await axios.get(URL_link + "random.php");
    const randomDrink = result.data.drinks[0];
    console.log(result.data.drinks[0]);
    res.render("index", { data: randomDrink});
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});