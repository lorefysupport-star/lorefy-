(function (global) {
  'use strict';

  function cast(prefix, names) {
    return names.map(function (entry, index) {
      var name = typeof entry === 'string' ? entry : entry.name;
      var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return { id: 'comic-' + prefix + '-' + slug, key: slug, name: name, latin: name,
        role: index < 3 ? '\u0631\u0626\u064a\u0633\u064a\u0629' : '\u0645\u0633\u0627\u0639\u062f\u0629', note: '', image: '',
        wikiTitle: typeof entry === 'string' ? '' : entry.wikiTitle || '', source: 'Lorefy comics catalog' };
    });
  }

  global.LorefyComicsCharacterCatalog = {
    'comic:marvel-spider-man': cast('marvel-spider-man', ['Peter Parker', 'Miles Morales', 'Gwen Stacy', 'Mary Jane Watson', 'Norman Osborn']),
    'comic:marvel-x-men': cast('marvel-x-men', ['Wolverine', 'Cyclops', 'Jean Grey', 'Storm', 'Magneto']),
    'comic:marvel-avengers': cast('marvel-avengers', ['Captain America', 'Iron Man', 'Thor', 'Black Widow', 'Hawkeye']),
    'comic:marvel-iron-man': cast('marvel-iron-man', ['Tony Stark', 'Pepper Potts', 'James Rhodes', 'Obadiah Stane']),
    'comic:marvel-thor': cast('marvel-thor', ['Thor', 'Loki', 'Jane Foster', 'Odin']),
    'comic:marvel-hulk': cast('marvel-hulk', ['Bruce Banner', 'Hulk', 'Betty Ross', 'Rick Jones']),
    'comic:marvel-captain-america': cast('marvel-captain-america', ['Steve Rogers', 'Bucky Barnes', 'Sam Wilson', 'Sharon Carter']),
    'comic:marvel-daredevil': cast('marvel-daredevil', ['Matt Murdock', 'Elektra Natchios', 'Karen Page', 'Wilson Fisk']),
    'comic:marvel-fantastic-four': cast('marvel-fantastic-four', ['Reed Richards', 'Sue Storm', 'Johnny Storm', 'Ben Grimm']),
    'comic:marvel-guardians': cast('marvel-guardians', ['Peter Quill', 'Gamora', 'Rocket', 'Groot']),
    'comic:marvel-deadpool': cast('marvel-deadpool', ['Wade Wilson', 'Vanessa Carlysle', 'Cable', 'Blind Al']),
    'comic:marvel-black-panther': cast('marvel-black-panther', ['T Challa', 'Shuri', 'Nakia', 'Erik Killmonger']),
    'comic:marvel-doctor-strange': cast('marvel-doctor-strange', ['Stephen Strange', 'Wong', 'Clea', 'Baron Mordo']),
    'comic:marvel-captain-marvel': cast('marvel-captain-marvel', ['Carol Danvers', 'Kamala Khan', 'Monica Rambeau', 'Nick Fury']),
    'comic:marvel-loki': cast('marvel-loki', ['Loki', 'Thor', 'Sylvie', 'Odin']),
    'comic:dc-batman': cast('dc-batman', [
      { name: 'Bruce Wayne', wikiTitle: 'Batman' },
      'Alfred Pennyworth', { name: 'Selina Kyle', wikiTitle: 'Catwoman' },
      { name: 'Dick Grayson', wikiTitle: 'Nightwing' }, { name: 'The Joker', wikiTitle: 'Joker (character)' },
      { name: 'Barbara Gordon', wikiTitle: 'Batgirl' }, { name: 'Commissioner James Gordon', wikiTitle: 'James Gordon' },
      { name: 'Tim Drake', wikiTitle: 'Robin (character)' }, { name: 'Jason Todd', wikiTitle: 'Red Hood' },
      { name: 'Damian Wayne', wikiTitle: 'Damian Wayne' }, 'Lucius Fox', 'Harvey Dent',
      { name: 'Oswald Cobblepot', wikiTitle: 'Penguin (character)' }, { name: 'Edward Nygma', wikiTitle: 'Riddler' },
      { name: 'Jonathan Crane', wikiTitle: 'Scarecrow (DC Comics)' }, { name: 'Bane', wikiTitle: 'Bane (DC Comics)' },
      "Ra's al Ghul", { name: 'Poison Ivy', wikiTitle: 'Poison Ivy (character)' },
      { name: 'Victor Fries', wikiTitle: 'Mister Freeze' }, { name: 'Kate Kane', wikiTitle: 'Batwoman' },
      'Harley Quinn', 'Talia al Ghul', 'Cassandra Cain', 'Stephanie Brown', { name: 'Azrael', wikiTitle: 'Azrael (DC Comics)' }
    ]),
    'comic:dc-superman': cast('dc-superman', ['Clark Kent', 'Lois Lane', 'Lex Luthor', 'Jimmy Olsen']),
    'comic:dc-wonder-woman': cast('dc-wonder-woman', ['Diana Prince', 'Steve Trevor', 'Hippolyta', 'Cheetah']),
    'comic:dc-justice-league': cast('dc-justice-league', ['Superman', 'Batman', 'Wonder Woman', 'The Flash', 'Aquaman']),
    'comic:dc-green-lantern': cast('dc-green-lantern', ['Hal Jordan', 'John Stewart', 'Sinestro', 'Carol Ferris']),
    'comic:dc-flash': cast('dc-flash', ['Barry Allen', 'Iris West', 'Wally West', 'Reverse-Flash']),
    'comic:dc-aquaman': cast('dc-aquaman', ['Arthur Curry', 'Mera', 'Orm', 'Aqualad']),
    'comic:dc-shazam': cast('dc-shazam', ['Billy Batson', 'Freddy Freeman', 'Mary Bromfield', 'Doctor Sivana']),
    'comic:dc-teen-titans': cast('dc-teen-titans', ['Robin', 'Starfire', 'Raven', 'Beast Boy', 'Cyborg']),
    'comic:dc-suicide-squad': cast('dc-suicide-squad', ['Harley Quinn', 'Deadshot', 'Captain Boomerang', 'Amanda Waller']),
    'comic:dc-watchmen': cast('dc-watchmen', ['Rorschach', 'Doctor Manhattan', 'Ozymandias', 'Nite Owl', 'Silk Spectre']),
    'comic:dc-sandman': cast('dc-sandman', ['Dream', 'Death', 'Lucifer Morningstar', 'Desire']),
    'comic:dc-swamp-thing': cast('dc-swamp-thing', ['Swamp Thing', 'Abigail Arcane', 'Anton Arcane', 'John Constantine']),
    'comic:other-walking-dead': cast('other-walking-dead', ['Rick Grimes', 'Michonne', 'Carl Grimes', 'Daryl Dixon']),
    'comic:other-invincible': cast('other-invincible', ['Mark Grayson', 'Omni-Man', 'Atom Eve', 'Allen the Alien']),
    'comic:other-teenage-mutant-ninja-turtles': cast('other-tmnt', ['Leonardo', 'Raphael', 'Donatello', 'Michelangelo', 'Splinter']),
    'comic:other-hellboy': cast('other-hellboy', ['Hellboy', 'Abe Sapien', 'Liz Sherman', 'Johann Kraus']),
    'comic:other-saga': cast('other-saga', ['Alana', 'Marko', 'Hazel', 'The Will']),
    'comic:other-spawn': cast('other-spawn', ['Al Simmons', 'Wanda Blake', 'Violator', 'Terry Fitzgerald']),
    'comic:other-the-boys': cast('other-the-boys', ['Billy Butcher', 'Hughie Campbell', 'Annie January', 'Homelander']),
    'comic:other-v-for-vendetta': cast('other-v-for-vendetta', ['V', 'Evey Hammond', 'Eric Finch', 'Adam Susan']),
    'comic:other-archies': cast('other-archies', ['Archie Andrews', 'Betty Cooper', 'Veronica Lodge', 'Jughead Jones']),
    'comic:other-peanuts': cast('other-peanuts', ['Charlie Brown', 'Snoopy', 'Lucy van Pelt', 'Linus van Pelt']),
    'comic:other-calvin-and-hobbes': cast('other-calvin-hobbes', ['Calvin', 'Hobbes', 'Susie Derkins', 'Rosalyn']),
    'comic:other-asterix': cast('other-asterix', ['Asterix', 'Obelix', 'Panoramix', 'Idefix']),
    'comic:other-tintin': cast('other-tintin', ['Tintin', 'Captain Haddock', 'Snowy', 'Professor Calculus'])
  };
})(window);
