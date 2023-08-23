// The Intl API is not very consistent between browsers, browser versions,
// browser editions (mobile vs non-mobile browser).. and maybe OS, and all of
// this - hence.....

const LANGNAMES = {
    chp: { eng: "Denesuline", nob: "Denesuline", sme: "Denesuline", },
    chr: { eng: "Cherokee", nob: "Cherokesisk", /*sme: "",*/ },
    deu: { eng: "German", nob: "Tysk", sme: "Duiskkagiella", },
    eng: { eng: "English", nob: "Engelsk", sme: "Eaŋgalsgiella", },
    est: { eng: "Estonian", nob: "Estisk", sme: "Esttegiella", },
    fin: { eng: "Finnish", nob: "Finsk", sme: "Suomagiella", },
    fit: { eng: "Meänkieli", nob: "Tornedalsfinsk", sme: "Meängiella", },
    fkv: { eng: "Kven", nob: "Kvensk", sme: "Kveanagiella", },
    hdn: { eng: "Northern Haida", nob: "Nordhaida", sme: "Davvihaidagiella", },
    hun: { eng: "Hungarian", nob: "Ungarsk", sme: "Ungáragiella", },
    izh: { eng: "Ingrian", nob: "Ingrisk", sme: "Inkeroisgiella", },
    koi: { eng: "Komi Permyak", nob: "Komipermjakisk", sme: "Komipermjakgiella", },
    kom: { eng: "Komi", nob: "Komi", sme: "Komigiella", },
    kpv: { eng: "Komi", nob: "Syrjensk", sme: "Komigiella", },
    lav: { eng: "Latvian", nob: "Latvisk", sme: "Latviagiella", },
    liv: { eng: "Liv", nob: "Livisk", sme: "Liivigiella", },
    mdf: { eng: "Moksha", nob: "Moksja", sme: "Mokšagiella", },
    mhr: { eng: "Eastern Mari", nob: "Østmarisk", sme: "Niitomarigiella", },
    mns: { eng: "Mansi", nob: "Mansisk", sme: "Mansigiella", },
    mrj: { eng: "Hill Mari", nob: "Vestmarisk", sme: "Várremarigiella", },
    myv: { eng: "Erzya", nob: "Erzja", sme: "Ersagiella", },
    nob: { nob: "Norsk bokmål", eng: "Norwegian bokmål", sme: "Dárogiella", },
    olo: { eng: "Livvi", nob: "Livvisk", sme: "Livvi", },
    otw: { eng: "Odawa", nob: "Odawa", sme: "Odawa", },
    ron: { eng: "Romanian", nob: "Rumensk", sme: "Romaniagiella", },
    rus: { eng: "Russian", nob: "Russisk", sme: "Ruoššagiella", },
    sjd: { eng: "Kildin Sámi", nob: "Kildinsamisk", sme: "Gielddasámegiella", fin: "Kiltinänsaame", },
    sje: { nob: "Pitesamisk", eng: "Pite Sámi", sme: "Bihtánsámegiella", },
    sjt: { eng: "Ter Saḿi", nob: "Tersamisk", sme: "Darjjesámegiella", fin: "Turjansaame", },
    sma: { eng: "Southern Sami", nob: "Sørsamisk", sme: "Lullisámegiella", fin: "Eteläsaame", },
    sme: { eng: "Northern Sami", nob: "Nordsamisk", sme: "Davvisámegiella", },
    smj: { eng: "Lule Sami", nob: "Lulesamisk", sme: "Julevsámegiella", },
    smn: { eng: "Inari sami", nob: "Enaresamisk", sme: "Anárašgiella", },
    sms: { nob: "Skoltesamisk", eng: "Skolt Sámi", sme: "Nuortalašgiella", },
    som: { eng: "Somali", nob: "Somalisk", sme: "Somaligiella", },
    srs: { eng: "Tsuutʼina", nob: "Tsuutʼina", sme: "Tsuutʼina", },
    swe: { eng: "Swedish", nob: "Svensk", sme: "Ruoŧagiella", },
    udm: { eng: "Udmurt", nob: "Udmurtisk", sme: "Udmurtagiella", },
    vot: { eng: "Votic", nob: "Votisk", sme: "Vatjagiella", },
    vro: { eng: "Võro", nob: "Võro", sme: "Võrogiella", },
    yrk: { eng: "Nenets", nob: "Nenetsisk", sme: "Nenetsagiella", },
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
