import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const URL_link = "https://www.thecocktaildb.com/api/json/v1/1/";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

function transformDrink(drink) {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const measure = drink[`strMeasure${i}`];
        const ingredient = drink[`strIngredient${i}`];
        if (ingredient) {
            ingredients.push(`${measure || ""} ${ingredient}`.trim());
        }
    }

    return {
        id: drink.idDrink,
        name: drink.strDrink,
        category: drink.strCategory,
        type: drink.strAlcoholic,
        mainIngredient: drink.strIngredient1,
        glassType: drink.strGlass,
        preparation: drink.strInstructions,
        ingredients: ingredients,
        image: drink.strDrinkThumb,
    }
}

app.get("/", async (req, res) => {
    const result = await axios.get(URL_link + "random.php");
    
    const randomDrink = transformDrink(result.data.drinks[0]);

    const alcoholicList = await axios.get(URL_link + "list.php?a=list");
    const aList = alcoholicList.data.drinks;
    const alcoholicArray = [];
    
    for (let i = 0; i < aList.length; i++) {
        const item = aList[i].strAlcoholic;
        alcoholicArray.push(item);
    }

    const categoryList = await axios.get(URL_link + "list.php?c=list");
    const cList = categoryList.data.drinks;
    const categoryArray = [];
    
    for (let i = 0; i < cList.length; i++) {
        const item = cList[i].strCategory;
        categoryArray.push(item);
    }

    const ingredientList = await axios.get(URL_link + "list.php?i=list");
    const iList = ingredientList.data.drinks;
    const ingredientArray = [];
    
    for (let i = 0; i < iList.length; i++) {
        const item = iList[i].strIngredient1;
        ingredientArray.push(item);
    }

    res.render("index", { data: randomDrink, category: categoryArray, type: alcoholicArray, ingredient: ingredientArray, drinks: null});
});

app.post("/recipe", async (req, res) => {
    const cocktailName = req.body.dname;
    //const cocktailCategory = req.body.category;
    //const cocktailIngredient = req.body.ingredient;
    //const cocktailType = req.body.type;
    const resultByName = await axios.get(URL_link + "search.php?s=" + cocktailName);
    const drinks = resultByName.data.drinks;
    const cocktailByName = []

    for(let i = 0; i < drinks.length; i++) {
        const oneDrink = drinks[i];
        const ingredients = [];

        for (let i = 1; i <= 15; i++) {
            const ingredient = oneDrink[`strIngredient${i}`];
            const measure = oneDrink[`strMeasure${i}`];
            if(ingredient) {
                ingredients.push(`${measure || ""} ${ingredient}`.trim());
            }
        }
        const drinkList = {
            id: oneDrink.idDrink,
            name: oneDrink.strDrink,
            category: oneDrink.strCategory,
            type: oneDrink.strAlcoholic,
            mainIngredient: oneDrink.strIngredient1,
            glassType: oneDrink.strGlass,
            preparation: oneDrink.strInstructions,
            ingredients: ingredients,
            image: oneDrink.strDrinkThumb,
        };
        cocktailByName.push(drinkList);
    }
    res.render("search", { drinks: cocktailByName});
});

app.post("/", (req, res) => {
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

