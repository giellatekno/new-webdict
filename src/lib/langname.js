// The Intl API is not very consistent between browsers, browser versions,
// browser editions (mobile vs non-mobile browser).. and maybe OS, and all of
// this - hence.....

const LANGNAMES = {
    fin: {
        eng: "Finnish",
        nob: "Finsk",
        sme: "Suomagiella",
    },
    fit: {
        eng: "Meänkieli",
        nob: "Tornedalsfinsk",
        sme: "Meängiella",
    },
    deu: {
        eng: "German",
        nob: "Tysk",
        sme: "Duiskkagiella",
    },
    sma: {
        eng: "Southern Sami",
        nob: "Sørsamisk",
        sme: "Lullisámegiella",
        fin: "Eteläsaame",
    },
    olo: {
        eng: "Livvi",
        nob: "Livvisk",
        sme: "Livvi",
    },
    yrk: {
        eng: "Nenets",
        nob: "Nenetsisk",
        sme: "Nenetsagiella",
    },
    otw: {
        eng: "Odawa",
        nob: "Odawa",
        sme: "Odawa",
    },
    mns: {
        eng: "Mansi",
        nob: "Mansisk",
        sme: "Mansigiella",
    },
    koi: {
        eng: "Komi Permyak",
        nob: "Komipermjakisk",
        sme: "Komipermjakgiella",
    },
    liv: {
        eng: "Liv",
        nob: "Livisk",
        sme: "Liivigiella",
    },
    hdn: {
        eng: "Northern Haida",
        nob: "Nordhaida",
        sme: "Davvihaidagiella",
    },
    som: {
        eng: "Somali",
        nob: "Somalisk",
        sme: "Somaligiella",
    },
    vot: {
        eng: "Votic",
        nob: "Votisk",
        sme: "Vatjagiella",
    },
    vro: {
        eng: "Võro",
        nob: "Võro",
        sme: "Võrogiella",
    },
    chp: {
        eng: "Denesuline",
        nob: "Denesuline",
        sme: "Denesuline",
    },
    mrj: {
        eng: "Hill Mari",
        nob: "Vestmarisk",
        sme: "Várremarigiella",
    },
    srs: {
        eng: "Tsuutʼina",
        nob: "Tsuutʼina",
        sme: "Tsuutʼina",
    },
    sme: {
        eng: "Northern Sami",
        nob: "Nordsamisk",
        sme: "Davvisámegiella",
    },
    eng: {
        eng: "English",
        nob: "Engelsk",
        sme: "Eaŋgalsgiella",
    },
    rus: {
        eng: "Russian",
        nob: "Russisk",
        sme: "Ruoššagiella",
    },
    udm: {
        eng: "Udmurt",
        nob: "Udmurtisk",
        sme: "Udmurtagiella",
    },
    kom: {
        eng: "Komi",
        nob: "Komi",
        sme: "Komigiella",
    },
    mdf: {
        eng: "Moksha",
        nob: "Moksja",
        sme: "Mokšagiella",
    },
    myv: {
        eng: "Erzya",
        nob: "Erzja",
        sme: "Ersagiella",
    },
    nob: {
        nob: "Norsk bokmål",
        eng: "Norwegian bokmål",
        sme: "Dárogiella",
    },
    fkv: {
        eng: "Kven",
        nob: "Kvensk",
        sme: "Kveanagiella",
    },
    sjd: {
        eng: "Kildin Sámi",
        nob: "Kildinsamisk",
        sme: "Gielddasámegiella",
        fin: "Kiltinänsaame",
    },
    smj: {
        eng: "Lule Sami",
        nob: "Lulesamisk",
        sme: "Julevsámegiella",
    },
    sje: {
        nob: "Pitesamisk",
        eng: "Pite Sámi",
        sme: "Bihtánsámegiella",
    },
    sjt: {
        eng: "Ter Saḿi",
        nob: "Tersamisk",
        sme: "Darjjesámegiella",
        fin: "Turjansaame",
    },
    smn: {
        eng: "Inari sami",
        nob: "Enaresamisk",
        sme: "Anárašgiella",
    },
    sms: {
        nob: "Skoltesamisk",
        eng: "Skolt Sámi",
        sme: "Nuortalašgiella",
    },
    swe: {
        eng: "Swedish",
        nob: "Svensk",
        sme: "Ruoŧagiella",
    },
};

function get_our(of, in_) {
    const lang = LANGNAMES[of];
    if (lang === undefined) {
        console.warn(`We don't have any information on how to say '${of}' in any language.`);
        return;
    }

    const our = lang[in_];
    if (our === undefined) {
        console.warn(`We don't know how to say '${of}' in ${in_}`);
        return;
    }

    return our;
}

export function langname(of, in_) {
    if (typeof of !== "string") {
        const msg = `langname(): argument 'of': must be a string, not ${type(of)}`;
        throw new TypeError(msg);
    }
    if (typeof in_ !== "string") {
        const msg = `langname(): argument 'in_': must be a string, not ${type(in_)}`;
        throw new TypeError(msg);
    }

    let result = get_our(of, in_);
    if (!result) {
        result = (new Intl.DisplayNames([in_], { type: "language" })).of(of);
        if (result === of) {
            console.warn(`Browser doesn't know how to say ${of} in ${in_}`);
        }
    }

    // replace normal spaces with non-breaking space to
    // prevent newlines in the middle of a language name
    return result.replaceAll(" ", "\xA0");
}
