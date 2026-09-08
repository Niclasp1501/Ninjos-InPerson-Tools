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
  return game.actors.filter(a =>
    a.type === "character" && user && a.testUserPermission(user, "OWNER"));
}

/** Why this account has no clear character, or null when it has one. */
export function whyNot(user) {
  if (characterOf(user)) return null;
  return ownedCharacters(user).length > 1 ? "many" : "none";
}
