/**
 * The prompt a 立繪 is drawn from.
 *
 * Two entries share it: the scheduled job that draws one card at a time, and
 * the batch job that draws a whole backlog at once. They have to ask for the
 * same thing, so the question lives here.
 *
 * The uniform follows the card's own era. A hoplite in a Wehrmacht tunic
 * was wrong in a way nobody had looked at, because every card in the
 * library was from the twentieth century.
 */
const NATION = {
  fr: {
    uni: "French military uniform of the period, horizon-blue tunic with red piping",
    pal: "horizon blue and red",
    old: {
      ancient: "a Gallic linen tunic over leather armour, bronze helmet with a crest",
      classical: "a Roman-style mail and scale cuirass with a red cloak and crested helmet",
      medieval: "a mail coat under a surcoat, kettle hat, kite shield",
      earlymodern: "a blackened half-armour with a plumed morion and a sash",
      preindustrial: "an eighteenth-century French infantry coat with lace and tricorn",
      industrial: "a 1860s French uniform with a kepi and grey-blue coat",
    },
  },
  de: {
    uni: "German Wehrmacht feldgrau tunic with collar tabs",
    pal: "feldgrau and gunmetal",
    old: {
      ancient: "a Germanic hide and mail cuirass, conical iron helmet, round shield",
      classical: "a Roman-style lorica segmentata over a red tunic, legionary helmet",
      medieval: "a mail coat with a kettle hat, a war-hammer and a kite shield",
      earlymodern: "a Landsknecht slashed doublet, plumed beret, half-pike",
      preindustrial: "an eighteenth-century Prussian infantry coat, tricorne and musket",
      industrial: "a 1860s Prussian uniform with a pickelhaube and dark blue coat",
    },
  },
  uk: {
    uni: "British khaki service dress with brass buttons and collar badges",
    pal: "khaki and brass",
    old: {
      ancient: "a bronze-age warrior in a bronze helmet and mail shirt, spear and round shield",
      classical: "a Roman-style segmented plate over a red tunic, legionary helmet",
      medieval: "a mail hauberk and kettle hat, a longbow, a kite shield",
      earlymodern: "a padded doublet and trunk hose, morion, and a matchlock musket",
      preindustrial: "an eighteenth-century redcoat with tricorn and flintlock musket",
      industrial: "a 1860s British rifleman in a dark blue frock coat, kepi and Spencer rifle",
    },
  },
  us: {
    uni: "American olive-drab service uniform with brass buttons",
    pal: "olive drab and brass",
    old: {
      ancient: "a hide and wicker shield, a spear and a stone-headed axe",
      medieval: "a gambeson and mail, kettle hat, a hand gun",
      earlymodern: "a buckskin fringed jacket and tricorn, a long rifle",
      preindustrial: "an early nineteenth-century militia coat with a tall shako",
      industrial: "a 1860s Union uniform with a kepi and Springfield rifle",
    },
  },
  ussr: {
    uni: "Soviet khaki officer tunic with collar tabs and shoulder boards",
    pal: "soviet green",
    old: {
      ancient: "a steppe nomad in a fur coat with a composite bow",
      medieval: "a Mongol lamellar coat with a fur cap and a composite bow",
      earlymodern: "a Muscovite cavalryman in a caftan and fur hat with a sabre",
      preindustrial: "an eighteenth-century Russian infantry coat and a tricorn",
      industrial: "a 1860s Russian soldier in a brown kaftan and tall shako",
    },
  },
  jp: {
    uni: "Japanese naval white dress uniform with gold trim and shoulder boards",
    pal: "white and gold",
    old: {
      ancient: "an ancient Japanese warrior in lamellar armour with a long bow",
      medieval: "a samurai in o-yoroi lamellar armour with a naginata",
      earlymodern: "a Japanese arquebusier in a jinbaori and a straw hat",
      preindustrial: "an Edo-period samurai in a kimono and lamellar cuirass with a matchlock",
      industrial: "a late nineteenth-century Japanese infantryman in a dark blue tunic and peaked cap",
    },
  },
  it: {
    uni: "Italian Royal Army grey-green uniform with collar patches",
    pal: "grey-green and bronze",
    old: {
      ancient: "an ancient Mediterranean warrior in a bronze helmet and scale cuirass with a red cloak",
      classical: "a Roman legionary in lorica segmentata, legionary helmet with a crest, scutum and gladius",
      medieval: "a Byzantine scale-armoured soldier in a conical helmet with a pavise",
      earlymodern: "an Italian condottieri in a half-armour with a plumed helmet and a rapier",
      preindustrial: "an eighteenth-century Italian infantry coat with tricorn",
      industrial: "a 1860s Italian Bersagliere with a feathered hat and a Carcano rifle",
    },
  },
  se: {
    uni: "Swedish grey uniform with collar patches",
    pal: "swedish grey and bronze",
    old: {
      ancient: "a Norse warrior in a bronze helmet with a round shield and a spear",
      medieval: "a Viking-age warrior in a mail shirt, round shield and a bearded axe",
      earlymodern: "a Swedish pikeman in a blue-and-yellow uniform with a corslet",
      preindustrial: "an eighteenth-century Swedish infantry coat with tricorn",
      industrial: "a 1860s Swedish soldier in a blue uniform and shako",
    },
  },
  cn: {
    uni: "Chinese PLA khaki uniform with red collar tabs",
    pal: "PLA green and red",
    old: {
      ancient: "a Zhou-era warrior in lamellar armour with a dagger-axe and a crossbow",
      classical: "a Han-era crossbowman in lacquered lamellar armour with a repeating crossbow",
      medieval: "a Song-dynasty crossbowman in black lacquered armour with a heavy repeating crossbow",
      earlymodern: "a Ming-dynasty matchlockman in a brigandine and a feathered cap",
      preindustrial: "a Qing-era soldier in a long robe with a conical hat and a matchlock",
      industrial: "a late nineteenth-century Green Standard soldier with a rifle and a queue",
    },
  },
  il: {
    uni: "Israeli olive-drab uniform",
    pal: "idf olive",
    old: {
      ancient: "a Judean spearman with a shield and a slingshot",
      medieval: "a Crusader knight in mail and a great helm with a crossbow",
      earlymodern: "an Ottoman-era irregular with a musket and a sash",
      preindustrial: "an Ottoman infantryman in a red fez and a long coat with a musket",
      industrial: "a late nineteenth-century Ottoman soldier in a dark uniform and a fez",
    },
  },
  // Feed-side nations. The game roster has no campaign for these, so they
  // only ever appear on a campaign card, and the gallery labels them from the
  // feed's own nation list.
  gr: {
    uni: "a Greek evzone in a fustanella, red fez and embroidered waistcoat",
    pal: "Greek blue and white",
    old: {
      ancient: "a Greek hoplite in a bronze helmet, bronze cuirass, red cloak and a hoplon shield",
      classical: "a Greek hoplite in a bronze helmet, bronze cuirass, red cloak and a hoplon shield",
      medieval: "a Byzantine Greek soldier in scale armour with a conical helmet and a long spear",
      earlymodern: "a Greek infantryman in a fustanella and a fez with a musket",
    },
  },
  tr: {
    uni: "an Ottoman sipahi in a dark-blue jacket and a red fez",
    pal: "ottoman crimson and indigo",
    old: {
      medieval: "an Ottoman sipahi in a mail coat under a turbaned helmet with a composite bow",
      earlymodern: "an Ottoman janissary in a bork robe and a tall white headdress with an arquebus",
      preindustrial: "an Ottoman artilleryman in a red jacket and a great turban beside a siege gun",
      industrial: "an Ottoman soldier in a dark-red tunic and a kalpak with a Martini-Henry rifle",
    },
  },
  es: {
    uni: "a Spanish infantry uniform of the period, grey-blue coat with red facings",
    pal: "castilian red and silver",
    old: {
      earlymodern: "a Spanish tercio pikeman in a buff coat and a morion with apartisan and a matchlock",
      preindustrial: "an eighteenth-century Spanish infantryman in a blue coat and tricorn",
      industrial: "a 1860s Carlist infantryman in a red beret with a Beret rifle",
    },
  },
  nl: {
    uni: "a Dutch marine in a dark blue eighteenth-century-style coat",
    pal: "dutch orange and navy",
    old: {
      earlymodern: "a Dutch musketeer in a buff coat and a leather cap with a matchlock musket",
      preindustrial: "an eighteenth-century Dutch soldier in a blue coat and tricorn",
      industrial: "a 1860s Dutch grenadier in a dark blue tunic and bearskin",
    },
  },
};

const LAYER = {
  land: "Army service dress; the vehicle's or gun's most recognisable part worn as a shoulder plate",
  air: "leather flight suit with a fur collar; an aircraft part - spinner, cowling louvre or wing-root rib - as a shoulder harness",
  sea: "naval dress; a ship's fitting - turret face, rangefinder or anchor-stock plate - as a collar device",
};
const KIND = {
  tank: "an armoured hull plate",
  infantry: "the service rifle's receiver as a chest plate",
  artillery: "a gun breech ring",
  fighter: "a spinner and cowling section",
  bomber: "a bomb-bay rack section",
  battleship: "a main-gun turret face",
  carrier: "an island structure",
  cruiser: "a bridge face and porthole band",
  submarine: "a periscope section",
  destroyer: "a gun turret face",
};

/**
 * The era of a card, from its service year. Negative years are BC, which the
 * feed writes for the pre-1000 spans.
 */
function eraOf(year) {
  if (year < 0) return { key: "ancient", phrase: "ancient" };
  if (year < 500) return { key: "classical", phrase: "classical antiquity" };
  if (year < 1000) return { key: "earlymedieval", phrase: "early medieval" };
  if (year < 1500) return { key: "medieval", phrase: "high medieval" };
  if (year < 1650) return { key: "earlymodern", phrase: "early modern" };
  if (year < 1800) return { key: "preindustrial", phrase: "pre-industrial" };
  if (year < 1919) return { key: "industrial", phrase: "the industrial age" };
  if (year <= 1945) return { key: "ww2", phrase: "Second World War era" };
  if (year <= 1991) return { key: "cold", phrase: "Cold War" };
  return { key: "modern", phrase: "modern" };
}

export function buildPrompt(card) {
  const nat = NATION[card.nation] || NATION.us;
  const lay = LAYER[card.layer] || LAYER.land;
  const kind = KIND[card.kind] || "the weapon's single most recognisable external feature";
  const era = eraOf(card.year);
  const uniform = card.year < 1900 && nat.old?.[era.key] ? nat.old[era.key] : nat.uni;
  const when = card.year < 0 ? `${-card.year} BC` : `${card.year}`;
  return [
    `Anime-style character portrait of an adult woman personifying the ${card.designation} (${when}).`,
    `She wears an accurate ${era.phrase} uniform: ${uniform}. Palette: ${nat.pal}.`,
    `Framing: bust-up, cropped near the mid-torso, facing the viewer.`,
    `Integrated into the outfit: ${kind}, ${lay}.`,
    `Background: a flat warm cream-to-beige vertical gradient, no scenery, no props.`,
    `Style: clean uniform line art, soft cel shading, gentle closed-mouth smile, warm brown eyes.`,
    `Dignified and composed, not in a fighting stance.`,
    `No text, no signature, no watermark, no real-world insignia or national flag.`,
  ].join(" ");
}
