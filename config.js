module.exports = {
  "port"             : 3333,
	"secret"           : "secret key",
	"redisHost"        : "localhost",
	"redisPort"        : 6379,
	"mongoURL"         : 'mongodb://localhost/happy',
	"salt"             : 'j2löjASDF309asfj1"#12312akjf09JKjl3ii',
	
	"rooms": {
      "maxClients"   : 0 /* maximum number of clients per room. 0 = no limit */
    },
    "stunservers"    : [
                        {"url": "stun:stun.l.google.com:19302"}
    ],
    "turnservers"    : [
        /*
        { "url": "turn:your.turn.server.here",
          "secret": "turnserversharedsecret",
          "expiry": 86400 }
          */
    ]
}