(function (global) {
  "use strict";
  var ROLE_MAIN = "\u0631\u0626\u064a\u0633\u064a\u0629";
  var ROLE_SUPPORT = "\u0645\u0633\u0627\u0639\u062f\u0629";
  global.LorefyLiteraryCharacterCatalog = {
    "n-percy-jackson-lightning": [
      { id: "lit-percy-jackson", key: "percy-jackson", name: "Percy Jackson", latin: "Percy Jackson", role: ROLE_MAIN, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-annabeth-chase", key: "annabeth-chase", name: "Annabeth Chase", latin: "Annabeth Chase", role: ROLE_MAIN, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-grover-underwood", key: "grover-underwood", name: "Grover Underwood", latin: "Grover Underwood", role: ROLE_MAIN, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-sally-jackson", key: "sally-jackson", name: "Sally Jackson", latin: "Sally Jackson", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-luke-castellan", key: "luke-castellan", name: "Luke Castellan", latin: "Luke Castellan", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-clarisse-la-rue", key: "clarisse-la-rue", name: "Clarisse La Rue", latin: "Clarisse La Rue", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-gabe-ugliano", key: "gabe-ugliano", name: "Gabe Ugliano", latin: "Gabe Ugliano", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-chiron", key: "chiron", name: "Chiron", latin: "Chiron", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-poseidon", key: "poseidon", name: "Poseidon", latin: "Poseidon", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-zeus", key: "zeus", name: "Zeus", latin: "Zeus", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-hades", key: "hades", name: "Hades", latin: "Hades", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" },
      { id: "lit-ares", key: "ares", name: "Ares", latin: "Ares", role: ROLE_SUPPORT, note: "The Lightning Thief", image: "", source: "Riordan Wiki" }
    ],
    "n-game-of-thrones": [
      { id: "lit-eddard-stark", key: "eddard-stark", name: "Eddard Stark", latin: "Eddard Stark", role: ROLE_MAIN, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-catelyn-stark", key: "catelyn-stark", name: "Catelyn Stark", latin: "Catelyn Stark", role: ROLE_MAIN, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-robb-stark", key: "robb-stark", name: "Robb Stark", latin: "Robb Stark", role: ROLE_MAIN, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-sansa-stark", key: "sansa-stark", name: "Sansa Stark", latin: "Sansa Stark", role: ROLE_MAIN, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-arya-stark", key: "arya-stark", name: "Arya Stark", latin: "Arya Stark", role: ROLE_MAIN, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-bran-stark", key: "bran-stark", name: "Bran Stark", latin: "Bran Stark", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-jon-snow", key: "jon-snow", name: "Jon Snow", latin: "Jon Snow", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-robert-baratheon", key: "robert-baratheon", name: "Robert Baratheon", latin: "Robert Baratheon", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-cersei-lannister", key: "cersei-lannister", name: "Cersei Lannister", latin: "Cersei Lannister", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-jaime-lannister", key: "jaime-lannister", name: "Jaime Lannister", latin: "Jaime Lannister", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-tyrion-lannister", key: "tyrion-lannister", name: "Tyrion Lannister", latin: "Tyrion Lannister", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" },
      { id: "lit-daenerys-targaryen", key: "daenerys-targaryen", name: "Daenerys Targaryen", latin: "Daenerys Targaryen", role: ROLE_SUPPORT, note: "A Game of Thrones", image: "", source: "Wikipedia" }
    ]
  };
  var catalog = global.LorefyLiteraryCharacterCatalog;
  catalog["title:a-game-of-thrones"] = catalog["n-game-of-thrones"];
  catalog["title:a-song-of-ice-and-fire"] = catalog["n-game-of-thrones"];
  catalog["ol-novel-works-ol17489309w"] = catalog["n-game-of-thrones"];
  catalog["title:the-lord-of-the-rings"] = [
    { id: "lit-frodo-baggins", key: "frodo-baggins", name: "Frodo Baggins", latin: "Frodo Baggins", role: ROLE_MAIN, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-samwise-gamgee", key: "samwise-gamgee", name: "Samwise Gamgee", latin: "Samwise Gamgee", role: ROLE_MAIN, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-gandalf", key: "gandalf", name: "Gandalf", latin: "Gandalf", role: ROLE_MAIN, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-aragorn", key: "aragorn", name: "Aragorn", latin: "Aragorn", role: ROLE_MAIN, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-legolas", key: "legolas", name: "Legolas", latin: "Legolas", role: ROLE_MAIN, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-gimli", key: "gimli", name: "Gimli", latin: "Gimli", role: ROLE_MAIN, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-boromir", key: "boromir", name: "Boromir", latin: "Boromir", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-meriadoc-brandybuck", key: "meriadoc-brandybuck", name: "Meriadoc Brandybuck", latin: "Meriadoc Brandybuck", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-peregrin-took", key: "peregrin-took", name: "Peregrin Took", latin: "Peregrin Took", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-gollum", key: "gollum", name: "Gollum", latin: "Gollum", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-sauron", key: "sauron", name: "Sauron", latin: "Sauron", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-saruman", key: "saruman", name: "Saruman", latin: "Saruman", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-galadriel", key: "galadriel", name: "Galadriel", latin: "Galadriel", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" },
    { id: "lit-elrond", key: "elrond", name: "Elrond", latin: "Elrond", role: ROLE_SUPPORT, note: "The Lord of the Rings", image: "", source: "Wikipedia" }
  ];
  catalog["title:lord-of-the-rings"] = catalog["title:the-lord-of-the-rings"];
  catalog["n-the-lord-of-the-rings"] = catalog["title:the-lord-of-the-rings"];
  global.LorefyLiteraryCharacterCatalogMeta = {
    version: "20260706-literary-v2",
    sources: ["Riordan Wiki", "Wikipedia", "Wikidata", "runtime Wikipedia/Fandom fallback"],
    excluded: "normal books only"
  };
})(window);
