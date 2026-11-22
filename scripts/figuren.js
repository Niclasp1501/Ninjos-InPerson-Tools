/**
 * Which character an account plays.
 *
 * These three helpers used to live in `trade.js`. The trade itself moved to
 * Ninjo's DnD Shops & Trade on 2026-09-08 (see `trade-start.js`), but the Sheet
 * View needs the same answer - which character does this account own, and if
 * the question has no clear answer, why not - and that has nothing to do with
 * trading. So they stayed behind, in a file named after what they actually do.
 */

/**
 * Which character does this account play?
 *
 * Not simply `user.character`. That field is the character *assigned* in the
 * account settings, and plenty of tables never fill it in - the players own
 * their sheet, open it from the sidebar and never notice the field exists.
 *
 * So: the assigned one if there is one, otherwise the single character this
 * account owns. Two or more owned and none assigned is genuinely ambiguous -
 * nobody but the player can say which of them is meant - and that case is
 * reported rather than guessed at.
 *
 * @param {User} user
 * @returns {Actor|null}
 */
export function characterOf(user) {
  if (user?.character) return user.character;
  const owned = ownedCharacters(user);
  return owned.length === 1 ? owned[0] : null;
}

/** Player characters this account owns outright. */
export function ownedCharacters(user) {
  return game.actors?.filter(a =>
    a.type === "character" && user && a.testUserPermission(user, "OWNER")) ?? [];
}

/**
 * Wie jemand in einer Liste heißt: die Figur zuerst, das Konto dahinter.
 *
 * Bis 14.2611.82 standen beim Zeigen, Herholen und in der Spielerleiste die
 * Anmeldenamen. Am Tisch denkt die Spielleitung aber in Figuren, und bei einem
 * Konto wie „Testnutzer2“ weiß niemand, wer dahintersteckt (Ninjo, 22.11.2026).
 * Konten ohne Figur, etwa die Monitore, behalten ihren Anmeldenamen. Die
 * Spielleitung besitzt jede Figur; für sie zählt nur die zugewiesene.
 *
 * @param {User} user
 * @returns {{name: string, konto: string}} `konto` ist leer, wenn es nichts hinzufügt
 */
export function anzeigeName(user) {
  const figur = (user?.isGM ? user.character : characterOf(user))?.name;
  const login = user?.name ?? "";
  if (!figur || figur === login) return { name: login, konto: "" };
  return { name: figur, konto: login };
}

/** Als einfacher Text, etwa für eine Auswahlliste oder eine Chatzeile: „Figur (Konto)“. */
export function anzeigeText(user) {
  const { name, konto } = anzeigeName(user);
  return konto ? `${name} (${konto})` : name;
}

/** Why this account has no clear character, or null when it has one. */
export function whyNot(user) {
  if (characterOf(user)) return null;
  return ownedCharacters(user).length > 1 ? "many" : "none";
}
