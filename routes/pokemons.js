const { IPFSTree, IPFSSingleton } = require('@owlprotocol/ipfs-trees');
const { keccak256 } = require('@multiformats/sha3');
// const ipfs = require('ipfs-core');
const { create } = require('ipfs-http-client');
const pokemon = require('../models/pokemon');

const hash = (v) => Buffer.from(
    keccak256.encode(
        JSON.stringify(v))).toString('hex');

const uploadedLeafs = [];
let tree;
const auth = 'Basic ' + Buffer.from('26l0jWtRhYtMnYyg3pjKGNSckwq' + ':' + 'fb815f4ebd3a1a67f92372016867dd66').toString('base64');
const ipfsClient = create({ url: 'https://ipfs.infura.io:5001/api/v0/', header: { authorization: auth }});
IPFSSingleton.setIPFS(ipfsClient);
tree = IPFSTree.createNull();
// ipfs.create().then(
//  (c) => {

//     // const config = {
//     //     Addresses: {
//     //         Swarm: [
//     //         // '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
//     //         // '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/',
//     //         // '/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/'
//     //         ]
//     //     }
//     // }

//     // c.config.set('Addresses', {});



//     IPFSSingleton.setIPFS(c);
//     tree = IPFSTree.createNull();
   

//     // tree.setJSON("abc", { abc: 123 });
//     // tree.set
    
//     // const uploadedLeafs = [];
//     //                  Sample Pokemons
//     //===============================================================
//     // tree .create({ "name": "charizard", "img": "https://giantbomb1.cbsistatic.com/uploads/scale_small/13/135472/1891763-006charizard.png" }, );
//     // // tree = tree.setJSON()
//     // for (const pok of defaultpokemon)
//     //     tree.setJSON(hash(pok), pok).then((t) => {tree = t; uploadedLeafs.push(pok)});
//     // // Uploaded cid hashes
//     // console.log(`Pushed hashes: ${uploadedLeafs}`);
    
//     }
// ); //('https://ipfs.infura.io:5001/api/v0'); //, header: { authorization: auth }});

var defaultpokemon = [
    { "name": "pikachu", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "charizard", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "snorlax", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "gyarados", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "alakazam", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "rapidash", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "onix", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "mewtwo", "img": "https://static.posters.cz/image/1300/poster/pokemon-pikachu-neon-i71936.jpg" },
    { "name": "leo", "img": "https://ca.slack-edge.com/T0368DD58SH-U0368G2UU4F-fa657dbd48c8-192" }
];


//===============================================================


var express = require("express"),
    router = express.Router(),
    middleware = require("../middleware"),
    Comment = require("../models/comments"),
    Pokemon = require("../models/pokemon");

//INDEX route
router.get("/", async function(req, res) {
    if (uploadedLeafs.length === 0)
        for (const pok of defaultpokemon) {
            // tree.setJSON(hash(pok), pok).then((t) => {tree = t; uploadedLeafs.push(pok)});
            tree = await tree.setJSON(hash(pok), pok);
            console.log(`Set ${pok.name}`);
            // await tree.put();
        }
        uploadedLeafs.push(...defaultpokemon.map(v => hash(v)));
        console.log(`Added leaves: ${uploadedLeafs.length}`);
        await tree.put();


    // console.log(req.user);
    allpokemon = [];
    for (const k of uploadedLeafs) {
        // const pok = await tree.getJSON(k);
        const cid = (await tree.cid());
        const pok = { cid: cid.toString(), _id: k, ...(await tree.getJSON(k))};
        allpokemon.push(pok);
    }

    // await tree.putAllSync();
    console.log(`Got all leafs!: ${JSON.stringify(allpokemon)}`);
    // uploadedLeafs.map(v => tree.getJSON(v).then(v => allpokemon.push(v)));
    res.render("pokemons", {
        pokemon: allpokemon,
        currentUser: req.user
    })
    // Pokemon.find({}, function(err, allpokemon) {
    //     if (err) {
    //         req.flash("error", error.message);
    //         console.log("ERROR !!");
    //     } else {
    //         res.render("pokemons", {
    //             pokemon: allpokemon,
    //             currentUser: req.user
    //         });
    //     }
    // });
});

//CREATE route
router.post("/", middleware.isLoggedIn, async function(req, res) {
    var obj = {
        name: req.body.name,
        img: req.body.url,
        description: req.body.desc,
        authorUsername: req.user.username,
        authorUserId: req.user._id
    };

    uploadedLeafs.push(hash(obj));
    const id = hash(obj);
    tree = await tree.setJSON(hash(obj), obj);

    console.log(`immediate get: ${JSON.stringify(await tree.getJSON(id))}`);

    // Pokemon.create(obj, function(err, newPok) {
    //     if (err) {
    //         req.flash("error", error.message);
    //         console.log("Error !!");
    //     } else {
    //         res.redirect("/pokemon");
    //     }
    // });
    res.redirect("/pokemon/" + id);
});

//NEW
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("new", { currentUser: req.user });
});

//SHOW
router.get("/:id", middleware.isLoggedIn, async function(req, res) {
    console.log(`Requesting poke at: ${req.params.id}`);
    const pokemonJSON = await tree.getJSON(req.params.id);
    if (typeof pokemonJSON === 'undefined')
        return;
    console.log(`Fetched poke from IPFS: ${JSON.stringify(pokemonJSON)}`);
    console.log(`Req params: ${JSON.stringify(req.params)}`);
    console.log(`Req URL: ${req.url}`);
    res.render("show", {
        pokemon: { _id: req.params.id, ...pokemonJSON },
        currentUser: req.user
    });
    // Pokemon.findById(req.params.id)
    //     .populate("comments")
    //     .exec(function(err, foundPok) {
    //         if (err) {
    //             console.log("ERROR !!!" + err);
    //         } else {
    //             res.render("show", {
    //                 pokemon: foundPok,
    //                 currentUser: req.user
    //             });
    //         }
    //     });
});

//EDIT ROUTES
//Edit Pokemon form
router.get("/:id/edit", async function(req, res) {
    const pokemonJSON = await tree.getJSON(req.params.id);
    console.log(`Got pokemon to edit: ${JSON.stringify(pokemonJSON)}`);
    res.render("edit", {
        pokemon: { _id: req.params.id, ...pokemonJSON },
        currentUser: req.user
    });
    // Pokemon.findById(req.params.id, function(error, foundPokemon) {
    //     if (error) {
    //         console.log(error);
    //         req.flash("error", error.message);
    //         req.redirect("back");
    //     }
    //     res.render("edit", { pokemon: foundPokemon, currentUser: req.user });
    // });
});
//Edit route logic
router.put("/:id", middleware.isLoggedIn, async function(req, res) {
    //find and update pokemon and redirect show page
    tree = await tree.setJSON(req.params.id, req.body.pok);
    console.log(`Redirecting user to: ${req.params.id}`);
    res.redirect("/pokemon/" + req.params.id);
    // Pokemon.findByIdAndUpdate(req.params.id, req.body.pok, function(
    //     err,
    //     updatedPok
    // ) {
    //     if (err) {
    //         res.redirect("/");
    //     } else {
    //         res.redirect("/pokemon/" + req.params.id);
    //     }
    // });
});

//DELETE ROUTE
router.delete("/:id", middleware.isLoggedIn, function(req, res) {
    Pokemon.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            req.flash("error", error.message);
            res.redirect("/pokemon");
        } else res.redirect("/pokemon");
    });
});

module.exports = router;
