async (page) => {
  await page.evaluate(() => {
    localStorage.setItem("lorefy.session.v1", JSON.stringify({
      userId: "qa-local",
      email: "qa@lorefy.local",
      mode: "demo"
    }));
    localStorage.setItem("lorefy.identity.v1", JSON.stringify({
      name: "قارئ Lorefy",
      un: "lorefy_reader",
      bio: "أرتب قراءاتي وأتابع الأعمال المفضلة في مكان واحد."
    }));
    localStorage.setItem("lorefy.user.preferences.v2", JSON.stringify({
      version: 2,
      formats: ["Manga", "Manhwa", "Novel", "Book"],
      genres: ["Action", "Drama", "Fantasy"],
      seedWorkIds: [
        "mal-manga-13-one-piece",
        "mal-manga-336-gto",
        "mal-manga-21-death-note"
      ],
      onboardingVersion: 2
    }));
  });
}
