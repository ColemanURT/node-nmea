var util   = require('util');
var nmea   = require('../lib/nmea001.js');
var assert = require('assert');

console.log(util.inspect(nmea));

suite('nmea',function() {
    setup(function() {
        
    });
    
    test("parse GPGGA with checksum",function() {
        var s = "GPGGA";
        var n = nmea.parse("$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M, , *42");
        assert.ok(n !== null,'parser result not null');
        if (n !== null) {
            assert.ok(n.id === s,s + '!== ' + n.id);
            assert.strictEqual(n.latitude,48.0 + (7.038 / 60.0),'latitude');
            assert.strictEqual(n.longitude,11.0 + (31.324 / 60.0),'longitude');
            assert.strictEqual(n.fix,1,'fix');
            assert.strictEqual(n.satellites,8,'sats');
            assert.strictEqual(n.hdop,0.9,'hdop');
            assert.strictEqual(n.altitude,545.4,'altitude');
            assert.strictEqual(n.aboveGeoid,46.9,'aboveGeoid');
            assert.equal(n.dgpsUpdate,'','dgpsUpdate');
            assert.equal(n.dgpsReference,'','dgpsUpdate');
        }
    });
    
    
    test("parse GPGGA without checksum",function() {
        var s = 'GPGGA';
        var n = nmea.parse("$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M,,");
        assert.ok(n !== null,'parser result not null');
        if (n !== null) {
            assert.ok(n.id === s,s + '!== ' + n.id);
            assert.strictEqual(n.latitude,48.0 + (7.038 / 60.0),'latitude');
            assert.strictEqual(n.longitude,11.0 + (31.324 / 60.0),'longitude');
            assert.strictEqual(n.fix,1,'fix');
            assert.strictEqual(n.satellites,8,'sats');
            assert.strictEqual(n.hdop,0.9,'hdop');
            assert.strictEqual(n.altitude,545.4,'altitude');
            assert.strictEqual(n.aboveGeoid,46.9,'aboveGeoid');
            assert.equal(n.dgpsUpdate,'','dgpsUpdate');
            assert.equal(n.dgpsReference,'','dgpsUpdate');
        }
    });
    
    test("parse GPRMC",function() {
        var s = 'GPRMC';
        var n = nmea.parse("$GPRMC,081836,A,3751.65,S,14507.36,E,000.0,360.0,130998,011.3,E*62");
        assert.ok(n !== null,'parser result not null');
        if (n !== null) {
            assert.ok(n.id === s,s + '!== ' + n.id);
            assert.equal(n.time,'081836','time');
            assert.equal(n.valid,'A','valid');
            assert.strictEqual(n.latitude,-(37.0 + (51.65/60.0)),'latitude');
            assert.strictEqual(n.longitude,145.0 + (7.36 / 60.0),'longitude');
            assert.strictEqual(n.speed,0.0,'speed');
            assert.strictEqual(n.course,360.0,'course');
            assert.equal(n.date,'130998','date');
            assert.strictEqual(n.variation,-11.3,'variation');
            assert.strictEqual(n.datetime.toUTCString(),'Tue, 13 Oct 1998 08:18:36 GMT','datetime');
        }
    });
    
    test("encode latitude",function() {
        var s;
        s = nmea.encodeLatitude(48.1173);
        assert.strictEqual(s,'4807.038,N',48.1173);
        s = nmea.encodeLatitude(-37.86083);
        assert.strictEqual(s,'3751.650,S',-37.86083);
    });
    
    test("encode longitude",function() {
        var s;
        s = nmea.encodeLongitude(11.522066);
        assert.strictEqual(s,'01131.324,E',11.522066);
    });
    
    test("encode then parse latitude",function() {
        var s;
        var lat;
        var hemi;
        var tokens;
        var epsilon = 0.0001
        var count = 0;
        var p;
        for(lat=-90.0;lat<=90.0;lat += 0.01) {
            s = nmea.encodeLatitude(lat);
            tokens = s.split(',');
            p = nmea.parseLatitude(tokens[0],tokens[1]);
    
            // only find failures
            if (Math.abs(lat - p) > epsilon) {
                assert.strictEqual(lat,p,s);
            }
        }
    });
    
    test("encode then parse longitude",function() {
        var s;
        var lon;
        var hemi;
        var tokens;
        var epsilon = 0.0001
        var count = 0;
        var p;
        for(lon=-180.0;lon<=180.0;lon += 0.01) {
            s = nmea.encodeLongitude(lon);
            tokens = s.split(',');
            p = nmea.parseLongitude(tokens[0],tokens[1]);
    
            // only find failures
            if (Math.abs(lon - p) > epsilon) {
                console.log(lon,p,s);
                assert.strictEqual(lon,p,s);
            }
        }
    });
    
    // $GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M, , *42
    test("GGA encoder",function() {
        var s;
        s = nmea.encode("GPGGA",
                        {
                            date:new Date(Date.UTC(98,08,13,12,35,19.0)),
                            lat:48.1173,
                            lon:11.522066,
                            fix:1,
                            satellites:8,
                            hdop:0.9,
                            altitude:545.4,
                            aboveGeoid:46.9
                        });
        assert.ok(s !== null);
        assert.strictEqual(s,'$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M,,*42','GPGGA');
    });
    
    test("RMC encoder",function() {
        var s;
        nmea.setLatitudePrecision(2);
        nmea.setLongitudePrecision(2);
        s = nmea.encode("GPRMC",{
            date:new Date(Date.UTC(98,8,13,8,18,36)),
            status:'A',
            lat:-37.86083,
            lon:145.12266,
            speed:0,
            course:360.0,
            variation:-11.3
        });
        if (s !== null) {
            assert.strictEqual(s,'$GPRMC,081836,A,3751.65,S,14507.36,E,000.0,360.0,130998,011.3,E*62','GPRMC');
        }
        else {
            assert.ok(s !== null);
        }
    });
    
    test("error handlers",function() {
        var n;
        
        console.log();
        assert.ok(nmea.error != null,'standard error handler not null');
        assert.equal(nmea.addParser(null),null,'null parser');
        
        n = nmea.parse("$GPGGA,123519,4807.038,N,01131.324,E,1,08,0.9,545.4,M,46.9,M");
        assert.equal(n,null,'GGA not enough tokens');
        
        n = nmea.parse("$GPRMC,081836,A,3751.65,S,14507.36,E,000.0,360.0,130998,011.3");
        assert.equal(n,null,'RMC not enough tokens');
        
    });
    
});
