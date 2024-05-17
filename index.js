const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = path.resolve(__dirname, "goodreads.db");

let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Create the movie table if it doesn't exist
    const createMovieTableQuery = `
      CREATE TABLE IF NOT EXISTS movie (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        summary TEXT NOT NULL
      );
    `;
    await db.run(createMovieTableQuery);

    // Array of movie data to be inserted
    const movies = [
      {
        name: "Harry Potter and the Order of the Phoenix",
        img: "https://bit.ly/2IcnSwz",
        summary:
          "Harry Potter and Dumbledore's warning about the return of Lord Voldemort is not heeded by the wizard authorities who, in turn, look to undermine Dumbledore's authority at Hogwarts and discredit Harry.",
      },
      {
        name: "The Lord of the Rings: The Fellowship of the Ring",
        img: "https://bit.ly/2tC1Lcg",
        summary:
          "A young hobbit, Frodo, who has found the One Ring that belongs to the Dark Lord Sauron, begins his journey with eight companions to Mount Doom, the only place where it can be destroyed.",
      },
      {
        name: "Avengers: Endgame",
        img: "https://bit.ly/2Pzczlb",
        summary:
          "Adrift in space with no food or water, Tony Stark sends a message to Pepper Potts as his oxygen supply starts to dwindle. Meanwhile, the remaining Avengers -- Thor, Black Widow, Captain America, and Bruce Banner -- must figure out a way to bring back their vanquished allies for an epic showdown with Thanos -- the evil demigod who decimated the planet and the universe.",
      },
    ];

    // Insert the movie data into the table
    const insertMovieQuery = `
      INSERT INTO movie (name, image_url, summary)
      VALUES (?, ?, ?);
    `;
    for (const movie of movies) {
      await db.run(insertMovieQuery, [movie.name, movie.img, movie.summary]);
    }

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// CRUD Operations for Movies

// Create a Movie
app.post("/movies/", async (request, response) => {
  try {
    const { name, imageUrl, summary } = request.body;
    const addMovieQuery = `
      INSERT INTO movie (name, image_url, summary)
      VALUES (?, ?, ?);
    `;
    await db.run(addMovieQuery, [name, imageUrl, summary]);
    response.send("Movie Successfully Added");
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// Read All Movies
app.get("/movies/", async (request, response) => {
  try {
    const getMoviesQuery = `
      SELECT * FROM movie ORDER BY id;
    `;
    const movies = await db.all(getMoviesQuery);
    response.send(movies);
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// Read a Movie by ID
app.get("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const getMovieQuery = `
      SELECT * FROM movie WHERE id = ?;
    `;
    const movie = await db.get(getMovieQuery, [movieId]);
    if (!movie) {
      response.status(404).send({ error: "Movie not found" });
    } else {
      response.send(movie);
    }
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// Update a Movie
app.put("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const { name, imageUrl, summary } = request.body;
    const updateMovieQuery = `
      UPDATE movie
      SET name = ?, image_url = ?, summary = ?
      WHERE id = ?;
    `;
    await db.run(updateMovieQuery, [name, imageUrl, summary, movieId]);
    response.send("Movie Updated Successfully");
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});

// Delete a Movie
app.delete("/movies/:movieId/", async (request, response) => {
  try {
    const { movieId } = request.params;
    const deleteMovieQuery = `
      DELETE FROM movie
      WHERE id = ?;
    `;
    await db.run(deleteMovieQuery, [movieId]);
    response.send("Movie Deleted Successfully");
  } catch (error) {
    response.status(500).send({ error: error.message });
  }
});
