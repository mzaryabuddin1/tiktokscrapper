import canvas from "canvas";
import { nets, env, detectAllFaces, TinyFaceDetectorOptions } from 'face-api.js';
import LanguageDetect from 'languagedetect';
const lngDetector = new LanguageDetect();


function loadModels() {
    nets.tinyFaceDetector.loadFromDisk('models'), //TINY FACE FOR FAST
        nets.faceLandmark68Net.loadFromDisk('models'), //EYES NOSE LIPS
        nets.faceRecognitionNet.loadFromDisk('models'), //WHERE IS FACE
        nets.faceExpressionNet.loadFromDisk('models'), //EXPRESSION
        nets.ageGenderNet.loadFromDisk('models') //Age gender
}
loadModels()

// DEFINES
const languages_iso = [
    { code: 'ab', name: 'abkhazian' },
    { code: 'aa', name: 'afar' },
    { code: 'af', name: 'afrikaans' },
    { code: 'ak', name: 'akan' },
    { code: 'sq', name: 'albanian' },
    { code: 'am', name: 'amharic' },
    { code: 'ar', name: 'arabic' },
    { code: 'an', name: 'aragonese' },
    { code: 'hy', name: 'armenian' },
    { code: 'as', name: 'assamese' },
    { code: 'av', name: 'avaric' },
    { code: 'ae', name: 'avestan' },
    { code: 'ay', name: 'aymara' },
    { code: 'az', name: 'azerbaijani' },
    { code: 'bm', name: 'bambara' },
    { code: 'ba', name: 'bashkir' },
    { code: 'eu', name: 'basque' },
    { code: 'be', name: 'belarusian' },
    { code: 'bn', name: 'bengali' },
    { code: 'bh', name: 'bihari languages' },
    { code: 'bi', name: 'bislama' },
    { code: 'bs', name: 'bosnian' },
    { code: 'br', name: 'breton' },
    { code: 'bg', name: 'bulgarian' },
    { code: 'my', name: 'burmese' },
    { code: 'ca', name: 'catalan, valencian' },
    { code: 'km', name: 'central khmer' },
    { code: 'ch', name: 'chamorro' },
    { code: 'ce', name: 'chechen' },
    { code: 'ny', name: 'chichewa, chewa, nyanja' },
    { code: 'zh', name: 'chinese' },
    { code: 'cu', name: 'church slavonic, old bulgarian, old church slavonic' },
    { code: 'cv', name: 'chuvash' },
    { code: 'kw', name: 'cornish' },
    { code: 'co', name: 'corsican' },
    { code: 'cr', name: 'cree' },
    { code: 'hr', name: 'croatian' },
    { code: 'cs', name: 'czech' },
    { code: 'da', name: 'danish' },
    { code: 'dv', name: 'divehi, dhivehi, maldivian' },
    { code: 'nl', name: 'dutch, flemish' },
    { code: 'dz', name: 'dzongkha' },
    { code: 'en', name: 'english' },
    { code: 'eo', name: 'esperanto' },
    { code: 'et', name: 'estonian' },
    { code: 'ee', name: 'ewe' },
    { code: 'fo', name: 'faroese' },
    { code: 'fj', name: 'fijian' },
    { code: 'fi', name: 'finnish' },
    { code: 'fr', name: 'french' },
    { code: 'ff', name: 'fulah' },
    { code: 'gd', name: 'gaelic, scottish gaelic' },
    { code: 'gl', name: 'galician' },
    { code: 'lg', name: 'ganda' },
    { code: 'ka', name: 'georgian' },
    { code: 'de', name: 'german' },
    { code: 'ki', name: 'gikuyu, kikuyu' },
    { code: 'el', name: 'greek (modern)' },
    { code: 'kl', name: 'greenlandic, kalaallisut' },
    { code: 'gn', name: 'guarani' },
    { code: 'gu', name: 'gujarati' },
    { code: 'ht', name: 'haitian, haitian creole' },
    { code: 'ha', name: 'hausa' },
    { code: 'he', name: 'hebrew' },
    { code: 'hz', name: 'herero' },
    { code: 'hi', name: 'hindi' },
    { code: 'ho', name: 'hiri motu' },
    { code: 'hu', name: 'hungarian' },
    { code: 'is', name: 'icelandic' },
    { code: 'io', name: 'ido' },
    { code: 'ig', name: 'igbo' },
    { code: 'id', name: 'indonesian' },
    { code: 'ia', name: 'interlingua (international auxiliary language association)' },
    { code: 'ie', name: 'interlingue' },
    { code: 'iu', name: 'inuktitut' },
    { code: 'ik', name: 'inupiaq' },
    { code: 'ga', name: 'irish' },
    { code: 'it', name: 'italian' },
    { code: 'ja', name: 'japanese' },
    { code: 'jv', name: 'javanese' },
    { code: 'kn', name: 'kannada' },
    { code: 'kr', name: 'kanuri' },
    { code: 'ks', name: 'kashmiri' },
    { code: 'kk', name: 'kazakh' },
    { code: 'rw', name: 'kinyarwanda' },
    { code: 'kv', name: 'komi' },
    { code: 'kg', name: 'kongo' },
    { code: 'ko', name: 'korean' },
    { code: 'kj', name: 'kwanyama, kuanyama' },
    { code: 'ku', name: 'kurdish' },
    { code: 'ky', name: 'kyrgyz' },
    { code: 'lo', name: 'lao' },
    { code: 'la', name: 'latin' },
    { code: 'lv', name: 'latvian' },
    { code: 'lb', name: 'letzeburgesch, luxembourgish' },
    { code: 'li', name: 'limburgish, limburgan, limburger' },
    { code: 'ln', name: 'lingala' },
    { code: 'lt', name: 'lithuanian' },
    { code: 'lu', name: 'luba-katanga' },
    { code: 'mk', name: 'macedonian' },
    { code: 'mg', name: 'malagasy' },
    { code: 'ms', name: 'malay' },
    { code: 'ml', name: 'malayalam' },
    { code: 'mt', name: 'maltese' },
    { code: 'gv', name: 'manx' },
    { code: 'mi', name: 'maori' },
    { code: 'mr', name: 'marathi' },
    { code: 'mh', name: 'marshallese' },
    { code: 'ro', name: 'moldovan, moldavian, romanian' },
    { code: 'mn', name: 'mongolian' },
    { code: 'na', name: 'nauru' },
    { code: 'nv', name: 'navajo, navaho' },
    { code: 'nd', name: 'northern ndebele' },
    { code: 'ng', name: 'ndonga' },
    { code: 'ne', name: 'nepali' },
    { code: 'se', name: 'northern sami' },
    { code: 'no', name: 'norwegian' },
    { code: 'nb', name: 'norwegian bokmål' },
    { code: 'nn', name: 'norwegian nynorsk' },
    { code: 'ii', name: 'nuosu, sichuan yi' },
    { code: 'oc', name: 'occitan (post 1500)' },
    { code: 'oj', name: 'ojibwa' },
    { code: 'or', name: 'oriya' },
    { code: 'om', name: 'oromo' },
    { code: 'os', name: 'ossetian, ossetic' },
    { code: 'pi', name: 'pali' },
    { code: 'pa', name: 'panjabi, punjabi' },
    { code: 'ps', name: 'pashto, pushto' },
    { code: 'fa', name: 'persian' },
    { code: 'pl', name: 'polish' },
    { code: 'pt', name: 'portuguese' },
    { code: 'qu', name: 'quechua' },
    { code: 'rm', name: 'romansh' },
    { code: 'rn', name: 'rundi' },
    { code: 'ru', name: 'russian' },
    { code: 'sm', name: 'samoan' },
    { code: 'sg', name: 'sango' },
    { code: 'sa', name: 'sanskrit' },
    { code: 'sc', name: 'sardinian' },
    { code: 'sr', name: 'serbian' },
    { code: 'sn', name: 'shona' },
    { code: 'sd', name: 'sindhi' },
    { code: 'si', name: 'sinhala, sinhalese' },
    { code: 'sk', name: 'slovak' },
    { code: 'sl', name: 'slovenian' },
    { code: 'so', name: 'somali' },
    { code: 'st', name: 'sotho, southern' },
    { code: 'nr', name: 'south ndebele' },
    { code: 'es', name: 'spanish, castilian' },
    { code: 'su', name: 'sundanese' },
    { code: 'sw', name: 'swahili' },
    { code: 'ss', name: 'swati' },
    { code: 'sv', name: 'swedish' },
    { code: 'tl', name: 'tagalog' },
    { code: 'ty', name: 'tahitian' },
    { code: 'tg', name: 'tajik' },
    { code: 'ta', name: 'tamil' },
    { code: 'tt', name: 'tatar' },
    { code: 'te', name: 'telugu' },
    { code: 'th', name: 'thai' },
    { code: 'bo', name: 'tibetan' },
    { code: 'ti', name: 'tigrinya' },
    { code: 'to', name: 'tonga (tonga islands)' },
    { code: 'ts', name: 'tsonga' },
    { code: 'tn', name: 'tswana' },
    { code: 'tr', name: 'turkish' },
    { code: 'tk', name: 'turkmen' },
    { code: 'tw', name: 'twi' },
    { code: 'ug', name: 'uighur, uyghur' },
    { code: 'uk', name: 'ukrainian' },
    { code: 'ur', name: 'urdu' },
    { code: 'uz', name: 'uzbek' },
    { code: 've', name: 'venda' },
    { code: 'vi', name: 'vietnamese' },
    { code: 'vo', name: 'volap_k' },
    { code: 'wa', name: 'walloon' },
    { code: 'cy', name: 'welsh' },
    { code: 'fy', name: 'western frisian' },
    { code: 'wo', name: 'wolof' },
    { code: 'xh', name: 'xhosa' },
    { code: 'yi', name: 'yiddish' },
    { code: 'yo', name: 'yoruba' },
    { code: 'za', name: 'zhuang, chuang' },
    { code: 'zu', name: 'zulu' }
]

// EXPORTS
export const remove_sign_from_url = (url) => {
    return url.replace(/\?.*$/g, "").replace("-sign-sg", "-amd-va").replace("-sign-va", "-amd-va").replace("-sign-useast2a", "-amd-va").replace(/180x180|100x100/g, "720x720")
}

export const predict_agegroup_and_gender = async (url) => {
    let detections = [];

    // mokey pathing the faceapi canvas
    let { Canvas, Image, ImageData } = canvas
    env.monkeyPatch({ Canvas, Image, ImageData })

    const img = await canvas.loadImage(url)
    detections = await detectAllFaces(img, new TinyFaceDetectorOptions()).withAgeAndGender()
    if (detections.length > 0) {
        let ageGroups = ["13-17", "18-24", "25-34", "35-44", "45-64", "65+"];
        if (detections[0].age >= 0 && detections[0].age < 17) {
            return { age: ageGroups[0], gender: detections[0].gender }
        } else if (detections[0].age >= 17 && detections[0].age < 24) {
            return { age: ageGroups[1], gender: detections[0].gender }
        } else if (detections[0].age >= 24 && detections[0].age < 34) {
            return { age: ageGroups[2], gender: detections[0].gender }
        } else if (detections[0].age >= 34 && detections[0].age < 44) {
            return { age: ageGroups[3], gender: detections[0].gender }
        } else if (detections[0].age >= 44 && detections[0].age < 64) {
            return { age: ageGroups[4], gender: detections[0].gender }
        } else if (detections[0].age >= 64) {
            return { age: ageGroups[5], gender: detections[0].gender }
        }
    } else {
        return "NA"
    }
}

export const predict_language = async (text) => {
    var detections = lngDetector.detect(text)
    if (detections.length > 0) {
        var index = languages_iso.findIndex(obj => obj.name === detections[0][0])
        return ((languages_iso[index]) ? languages_iso[index] : 'NA')
    } else {
        return 'NA'
    }
}

export const audience_reachablity = async (arr) => {
    let audience_reach_matrics = [
        { code: "-500", score: 0 },
        { code: "500-1000", score: 0 },
        { code: "1000-1500", score: 0 },
        { code: "1500-", score: 0 }
    ]
    const count = arr.length
    if (arr.length > 0) {

        arr.map((row) => {
            if (row < 500) {
                audience_reach_matrics[0].score += 1
            } else if (row >= 500 && row < 1000) {
                audience_reach_matrics[1].score += 1
            } else if (row >= 1000 && row < 1500) {
                audience_reach_matrics[2].score += 1
            } else if (row > 1500) {
                audience_reach_matrics[3].score += 1
            }
        })

        const sum = audience_reach_matrics.reduce((total, current) => total + current.score, 0)

        for (let index = 0; index < audience_reach_matrics.length; index++) {
            audience_reach_matrics[index].weight = audience_reach_matrics[index].score / sum
        }

        console.log(audience_reach_matrics)
        return []
    } else {
        return [{ code: audience_reach_matrics[0], weight: 0 }, { code: audience_reach_matrics[1], weight: 0 }, { code: audience_reach_matrics[2], weight: 0 }, { code: audience_reach_matrics[3], weight: 0 }]
    }

}

export const calculateGenderRatio = (data) => {

    let maleCount = 0;
    let femaleCount = 0;

    data.forEach(entry => {
        if (entry.gender === "male") {
            maleCount++;
        } else if (entry.gender === "female") {
            femaleCount++;
        }
    });

    const total = maleCount + femaleCount;
    const maleRatio = maleCount / total;
    const femaleRatio = femaleCount / total;

    return [{ code: "MALE", weight: parseFloat(maleRatio) }, { code: "FEMALE", weight: parseFloat(femaleRatio) }];
}

export const calculateAgeRatio = (data) => {
    const ageGroups = ["13-17", "18-24", "25-34", "35-44", "45-64", "65+"];
    const ageCount = {};

    // Initialize age count for each age group
    ageGroups.forEach(group => {
        ageCount[group] = 0;
    });

    data.forEach(entry => {
        const { age } = entry;
        if (ageCount.hasOwnProperty(age)) {
            ageCount[age]++;
        }
    });

    const total = data.length;
    const ageRatio = {};

    ageGroups.forEach(group => {
        const ratio = ageCount[group] / total;
        ageRatio[group] = ratio;
    });

    var ageRatioArr = []
    Object.entries(ageRatio).forEach(entry => {
        const [key, value] = entry;
        ageRatioArr.push({ code: key, weight: value })
    });

    return ageRatioArr;
}

export const calculateGendersPerAge = (ages_data, gender_data) => {
    var gendersPerAge = []
    for (let i = 0; i < ages_data.length; i++) {
        let obj = {
            code: ages_data[i].code,
            male: (ages_data[i].weight * gender_data[0].weight), //MALE
            female: (ages_data[i].weight * gender_data[1].weight) //FEMALE
        }
        gendersPerAge.push(obj)
    }
    return gendersPerAge;
}

export const createLanguageRatio = (languages) => {
    const languageCounts = {};
    const totalLanguages = languages.length;

    // Count the occurrences of each language
    languages.forEach((language) => {
        const code = language.code;
        if (languageCounts[code]) {
            languageCounts[code]++;
        } else {
            languageCounts[code] = 1;
        }
    });

    // Calculate the weight percentage for each language
    const languageWeights = Object.keys(languageCounts).map((code) => {
        const weight = languageCounts[code] / totalLanguages;
        return { code, weight };
    });

    return languageWeights;
}


