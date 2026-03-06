import { rhymesDB } from "./rhymesDB";
import { thesaurusDB } from "./thesaurusDB";

export const DB = {
  rhymes: rhymesDB,
  syllableRules: {
    prefixes: ["un","re","pre","mis","dis","over","under","out","up","down","fore","mid","sub","super","trans","anti","auto","bi","co","counter","de","ex","extra","hyper","in","inter","intra","macro","micro","mono","multi","neo","non","pan","para","post","pro","semi","tri"],
    suffixes: ["ing","ed","er","est","ly","ness","ment","tion","sion","able","ible","ful","less","ous","ious","eous","al","ial","ic","ical","ive","ative","ize","ise","ify","ate","en","age","ance","ence","ancy","ency","ant","ent","ism","ist","ity","ize","ous"],
    silent_e: true,
    vowel_pairs: ["ai","au","ea","ee","ei","eu","ew","ie","oa","oe","oi","oo","ou","ow","oy","ue","ui"],
  },
  thesaurus: thesaurusDB,
};
