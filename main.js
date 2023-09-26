//DATABASE
import { connect, model, Schema } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
const conn = connect(process.env.MONGODB_URL).then(
    () => { console.log('Mongo DB Connected'); }
)
const rawdata = model('rawdatas', Schema({}, { strict: false }))
const dataset = model('datasets', Schema({}, { strict: false }))
const workerque = model('workerques', Schema({}, { strict: false }))



// AI
// import countryDetector from "country-in-text-detector";
import {
    remove_sign_from_url,
    predict_agegroup_and_gender,
    predict_language,
    audience_reachablity,
    calculateGenderRatio,
    calculateAgeRatio,
    calculateGendersPerAge,
    createLanguageRatio
} from './helper/functions.js';


const main_function = async () => {
    let work;
    let dataset_already_exist = false
    const datetime = new Date()
    console.log("StartTime : " , datetime.toISOString())


    await rawdata.find({ 'workque_status': 0 }).limit(1)
        .then(docs => {
            work = docs
        })
        .catch(err => {
            console.log(err)
        })


    if (!work.length > 0) { return false; }

    await rawdata.findByIdAndUpdate(work[0]._id, {
        $set: { workque_status: 0 }, //WIP
        $push: { updated_at: { datetime: datetime, work: "Analysis Started" } }
    })

    let existing_dataset;
    await dataset.find({ 'user_profile.type': 'tiktok', 'user_profile.username': work[0].workque_username })
        .then(records => { if (records.length > 0) { dataset_already_exist = true; existing_dataset = records } })
        .catch(err => console.log(err))

    // PROCESS

    let matchingObject = null;

    for (const obj of work[0].data) {
        if (obj.url.includes("/user/detail")) {
            matchingObject = obj;
            break;
        }
    }

 

    if (!matchingObject) { console.log("/user/detail Not found"); return false }

    let scraped = {}
    scraped.user_profile = {}
    scraped.user_profile.type = "tiktok"
    scraped.user_profile.user_id = matchingObject.response.userInfo.user.id
    scraped.user_profile.sec_uid = matchingObject.response.userInfo.user.secUid
    scraped.user_profile.username = matchingObject.response.userInfo.user.uniqueId
    scraped.user_profile.url = 'https://www.tiktok.com/@' + scraped.user_profile.user_id
    // scraped.user_profile.picture = remove_sign_from_url(matchingObject.response.userInfo.user.avatarMedium)
    scraped.user_profile.picture = matchingObject.response.userInfo.user.avatarMedium
    scraped.user_profile.fullname = matchingObject.response.userInfo.user.nickname
    scraped.user_profile.description = matchingObject.response.userInfo.user.signature
    scraped.user_profile.is_verified = matchingObject.response.userInfo.user.verified
    scraped.user_profile.is_hidden = matchingObject.response.userInfo.user.secret



    let influencer_age_and_gender = await predict_agegroup_and_gender(scraped.user_profile.picture)
    if (influencer_age_and_gender != 'NA') {
        scraped.user_profile.gender = influencer_age_and_gender.gender
        scraped.user_profile.age_group = influencer_age_and_gender.age
    }


    let influencer_language = await predict_language(scraped.user_profile.description)
    if (influencer_language != 'NA') {
        scraped.user_profile.language = influencer_language
    }

    scraped.user_profile.followers = matchingObject.response.userInfo.stats.followerCount
    scraped.user_profile.following = matchingObject.response.userInfo.stats.followingCount
    scraped.user_profile.posts_count = matchingObject.response.userInfo.stats.videoCount
    scraped.user_profile.engagements = parseInt(work[0].info.reduce((sum, row) => { return sum + ((row.video_likes)?row.video_likes: 0); }, 0) / work[0].info.length)
    scraped.user_profile.engagement_rate = (scraped.user_profile.engagements / scraped.user_profile.followers)
    scraped.user_profile.avg_likes = scraped.user_profile.engagements
    scraped.user_profile.avg_comments = parseInt(work[0].info.reduce((sum, row) => { return sum + ((row.video_comments)?row.video_comments:0); }, 0) / work[0].info.length)
    scraped.user_profile.avg_views = parseInt(work[0].videos_views_arr.reduce((sum, row) => { return sum + row; }, 0) / work[0].videos_views_arr.length)
    scraped.user_profile.total_likes = matchingObject.response.userInfo.stats.heartCount

    
    

    if (existing_dataset) {
        let previous_stats = existing_dataset[0].user_profile.stat_history
        const currentDate = new Date()
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1
        // const day = String(currentDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}`;

        if (previous_stats[previous_stats.length - 1].month == formattedDate) {
            console.log("Updated in current month")
        } else {
            console.log("Updated in last month")
        }

    } else {
        scraped.user_profile.stat_history = []
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1 - i).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}`;

            let obj = {
                month: formattedDate,
                followers: scraped.user_profile.followers,
                following: scraped.user_profile.following,
                avg_likes: scraped.user_profile.avg_likes,
                avg_comments: scraped.user_profile.avg_comments,
                avg_views: scraped.user_profile.avg_views,
                total_likes: scraped.user_profile.total_likes
            }
            scraped.user_profile.stat_history.push(obj)
        }
    }

  


    const allHashtags = []
    let last_posts = []
    work[0].info.forEach(item => {
        const trimmedHashtags = item.hashtags.map(hashtag => hashtag.toLowerCase().replace(/#/g, '').replace(/@/g, '').trim())
        allHashtags.push(...trimmedHashtags);

        var obj = {}
        obj.user_id = scraped.user_profile.user_id
        obj.username = scraped.user_profile.username
        obj.user_picture = scraped.user_profile.picture
        obj.user_url = scraped.user_profile.url
        obj.type = 'video'
        obj.post_id = item.video_id
        obj.created = item.created
        obj.text = item.video_description
        obj.video = item.video_url
        obj.thumbnail = item.video_thumbnail
        obj.link = item.video_url
        obj.stat = {
            likes: ((item?.video_likes)?item?.video_likes:0),
            comments: ((item?.video_comments)?item.video_comments:0),
            views: ((item.video_views)?item.video_views:0),
            saves: ((item.video_saved)?item.video_saved:0)
        }
        last_posts.push(obj)
    })

    


    const tagFrequency = {};
    // Calculate frequency of each tag
    allHashtags.forEach(tag => {
        if (tagFrequency[tag]) {
            tagFrequency[tag]++;
        } else {
            tagFrequency[tag] = 1;
        }
    });

    // Calculate total count
    const totalCount = allHashtags.length
    // Convert frequency object to array of objects
    const tagFrequencyArray = Object.entries(tagFrequency).map(([tag, freq]) => ({
        tag,
        freq: (freq / totalCount)
    }))

    tagFrequencyArray.sort((a, b) => b.freq - a.freq)

    scraped.user_profile.relevant_tags = tagFrequencyArray

    let similarusers = []
    const response_params = {
        _id: 0,
        'user_profile.user_id': 1,
        'user_profile.username': 1,
        'user_profile.picture': 1,
        'user_profile.followers': 1,
        'user_profile.fullname': 1,
        'user_profile.url': 1,
        'user_profile.is_verified': 1,
        'user_profile.engagements': 1
    }

    await dataset.find({
        "user_profile.relevant_tags": {
            "$elemMatch": {
                "tag": tagFrequencyArray[0].tag,
                "freq": { "$gte": tagFrequencyArray[0].freq }
            }
        },
        "user_profile.username": { "$ne": scraped.user_profile.username },
        "user_profile.type": "tiktok"
    }, response_params).sort({ "user_profile.engagements": -1 }).limit(30).then(docs => {
        similarusers = docs
    }).catch(err => console.log(err))

    if (similarusers.length > 0) {
        scraped.user_profile.similar_users = similarusers.map(item => item.user_profile)
    }

    scraped.user_profile.top_posts = last_posts.sort((a, b) => a.stat.likes - b.stat.likes)
    scraped.user_profile.recent_posts = last_posts.sort((a, b) => new Date(a.created) - new Date(b.created))


    // LIKERS
    scraped.audience_likers = {
        "success": false,
        "error": "empty_audience"
    }

    //FOLLOWERS
    scraped.audience_followers = {
        "success": true,
    }
    scraped.audience_followers.data = {}

    // Reachablity
    let followings_of_followers = []
    let followers_images = []
    let followers_comment_text = []
    for (const obj of work[0].data) {
        if (obj.url.includes("/user/detail")) {
            if(obj?.response?.userInfo?.stats?.followerCount){
                followings_of_followers.push(obj.response.userInfo.stats.followerCount);
            }
        } else if (obj.url.includes("/comment/list/")) {
            if(obj?.response?.comments){
                obj.response.comments.map((row) => {
                    const emojiRegex = /[\p{Emoji}]/gu;
                    // followers_images.push(row.user.avatar_thumb.url_list[0].replace(/\?.*$/g, "").replace("-sign-sg", "-amd-va").replace("-sign-va", "-amd-va").replace("-sign-useast2a", "-amd-va").replace(/180x180|100x100|480x480/g, "720x720"))
                    followers_images.push("https://i.pinimg.com/1200x/11/c1/56/11c1569c59a5732b5d60080902dfb7b2.jpg")
                    followers_comment_text.push(row.text.replace(emojiRegex, '').toLowerCase())
                })
            }
        }
    }

    // Gender Ratio
    scraped.audience_followers.data.audience_reachablity = await audience_reachablity(followings_of_followers)

 

    let predicted_age_and_gender_array
    try {
        followers_images = followers_images.slice(0, 30) //TEMPORARY
        console.log(followers_images.length)
        const predicted_age_and_gender_with_NA = await Promise.all(followers_images.map(url => predict_agegroup_and_gender(url)))
        predicted_age_and_gender_array = predicted_age_and_gender_with_NA.filter((item) => { return item != 'NA' })
    } catch (error) {
        console.log("predict_agegroup_and_gender error: ", error)
    }

   


    let predict_language_array
    try {
        followers_comment_text = followers_comment_text.slice(0, 5) //TEMPORARY
        const predict_language_with_NA = await Promise.all(followers_comment_text.map(text => predict_language(text)))
        predict_language_array = predict_language_with_NA.filter((item) => { return item != 'NA' })
    } catch (error) {
        console.log("predict_language error: ", error)
    }


    scraped.audience_followers.data.audience_genders = calculateGenderRatio(predicted_age_and_gender_array)
    scraped.audience_followers.data.audience_ages = calculateAgeRatio(predicted_age_and_gender_array)
    scraped.audience_followers.data.audience_genders_per_age = calculateGendersPerAge(scraped.audience_followers.data.audience_ages, scraped.audience_followers.data.audience_genders)
    scraped.audience_followers.data.audience_languages = createLanguageRatio(predict_language_array)

    let followers_users = []
    for (const obj of work[0].data) {
        if (obj.url.includes("/user/detail") && obj?.response?.userInfo?.user.id != scraped.user_profile.user_id) {
            var objx = {}
            objx.user_id = obj.response.userInfo.user.id
            objx.username = obj.response.userInfo.user.uniqueId
            objx.picture = obj.response.userInfo.user.avatarMedium
            objx.followers = obj.response.userInfo.stats.followerCount
            objx.fullname = obj.response.userInfo.user.nickname
            objx.url = "https://www.tiktok.com/@" + obj.response.userInfo.user.id
            objx.is_verified = obj.response.userInfo.user.verified
            objx.engagements = obj.response.userInfo.stats.heartCount
            followers_users.push(objx)
        }
    }
    scraped.audience_followers.data.notable_users = followers_users.filter(user => user.followers > 1000).sort((a, b) => b.engagements - a.engagements)

    

    let followers_plain_usernames = followers_users.map(obj => obj.username)
    followers_plain_usernames.push("bayashi.tiktok")

    let audience_lookalies = []
    await dataset.find({
        "audience_followers.data.notable_users": {
            $elemMatch: {
                $or: followers_plain_usernames.map(txt => ({
                    username: txt
                }))
            }
        },
        "user_profile.username": { "$ne": scraped.user_profile.username },
        "user_profile.type": "tiktok"
    }, response_params).sort({ "user_profile.engagements": -1 }).limit(30).then(docs => {
        audience_lookalies = docs
    }).catch(err => console.log(err))

    scraped.audience_followers.data.audience_lookalikes = audience_lookalies

    // COMMENTERS
    scraped.audience_commenters = {
        "success": false,
        "error": "empty_audience"
    }

    // EXTRAS
    scraped.extra = {}
    scraped.extra.engagement_rate_histogram = [
        {
            "max": 0.1,
            "total": 100
        },
        {
            "min": 0.1,
            "max": 100,
            "total": 100
        },
        {
            "min": 0.1,
            "max": 0.2,
            "total": 100,
            "median": true
        },
        {
            "min": 0.1,
            "max": 100,
            "total": 100
        }
    ]

    let is_duplicate = false
    try {
        const records = await dataset.find({ "user_profile.type": "tiktok", "user_profile.user_id": scraped.user_profile.user_id })
        if (records.length > 0) { is_duplicate = true }
    } catch (error) {
        console.log(error)
    }

    const datetime2 = new Date()
    console.log("EndTime : " , datetime2.toISOString())
    
    // Calculate the time difference in milliseconds
    const timeDifferenceInMilliseconds = datetime2 - datetime;

    // Convert milliseconds to seconds
    const timeDifferenceInSeconds = timeDifferenceInMilliseconds / 1000;

    console.log("Time Difference in Seconds: ", timeDifferenceInSeconds);

    if (is_duplicate) {
        //UPDATE
        console.log("Updated")
    } else {
        //SAVE
        const newdataset = new dataset(scraped)
        try {
            // await newdataset.save()
            await rawdata.findByIdAndUpdate(work[0]._id, {
                $set: { workque_status: 0 }, //DONE
                $push: { updated_at: { datetime: datetime, work: "Analysis Completed Saved In Database" } }
            })
            console.log("Saved")
        } catch (error) {
            console.log(error)
        }
    }

}

// (async () => {
//     setInterval(main_function, 5000);
// })();

main_function()
