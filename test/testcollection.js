let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath});
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let User = require('../Users');
let db = require('../db')();
chai.should();

chai.use(chaiHttp);

let login_details = {
    name: 'test',
    username: 'email@email.com',
    password: '123@abc'
}

describe('Register, Login and Call Test Collection with Basic Auth and JWT Auth', () => {
    beforeEach((done) => { //Before each test initialize the database to empty
        //db.userList = [];

        done();
    })

    after((done) => { //after this test suite empty the database
        //db.userList = [];
        User.deleteOne({ name: 'test'}, function(err, user) {
            if (err) throw err;
        });
        done();
    })

    //Test the GET route
    describe('/signup', () => {
        it('it should register, login and check our token', (done) => {
            chai.request(server)
                .post('/signup')
                .send(login_details)
                .end((err, res) =>{
                    console.log(JSON.stringify(res.body));
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);
                    //follow-up to get the JWT token
                    chai.request(server)
                        .post('/signin')
                        .send(login_details)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('token');
                            let token = res.body.token;
                           // console.log(token);
                            chai.request(server)
                                .put('/testcollection')
                                .set('Authorization',token)
                                .send({echo:''})
                                .end((err,res) =>{
                                    res.should.have.status(200);
                                    res.body.body.should.have.property('echo')
                                    done();
                                })


                        })
                })
        })
    });

    describe('/movies GET test', () => {
        it('should respond with status code 200 and the req information', (done) => {
            chai.request(server)
                .get('/movies')
                .end((err, res) =>{
                    res.should.have.status(200);
                    res.body.should.have.property('env');
                    res.body.should.have.property('message').equal('GET movies');
                    done();
                })
        })
    });
    describe('/movies POST test', () => {
        it('should respond with status code 200 and the message movie saved', (done) => {
            chai.request(server)
                .post('/movies')
                .end((err, res) =>{
                    res.should.have.status(200);
                    res.body.should.have.property('message').equal('movie saved');
                    done();
                })
        })
    });
    describe('/movies PUT test', () => {
        it('should respond with message of movie updated and require jwt Auth', (done) => {
            chai.request(server)
                .post('/signin')
                .send(login_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('token')

                    let token = res.body.token;

                    chai.request(server)
                        .put('/movies')
                        .set('Authorization', token)
                        .send({echo: ''})
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.body.should.have.property('message').equal('movie updated');
                            done();
                        })
                })
        })
    });

    describe('/movies DELETE test', () => {
        it('delete requires basic auth and send back the msg movie deleted', (done) => {
            chai.request(server)
                .delete('/movies')
                .auth('cu_user', 'cu_rulez')
                .send({echo: ''})
                .end((err, res) =>{
                    res.should.have.status(200);
                    res.body.should.have.property('message').equal('movie deleted');
                    done();
                })
        })
    });
    describe('/testcollection fail auth',()=>{
        it('delete requires basic auth failed login',(done)=>{
           chai.request(server)
               .delete('/testcolleciton')
               .auth('cu_user','cu_rulez1')
               .send({echo:''})
               .end((err,res) =>{
                   res.should.have.status(401);
                   done();
               })
        });
    });

});