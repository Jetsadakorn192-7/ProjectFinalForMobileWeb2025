// import 'styles.css';

const { Alert, Card, Button, Table, Form, Row, Col, Container} = ReactBootstrap;

const firebaseConfig = {
    apiKey: "AIzaSyC5-rP8Y58aNy42NWkaIguYqhcsRS6-Ies",
    authDomain: "projectfinalwebapplication2025.firebaseapp.com",
    projectId: "projectfinalwebapplication2025",
    storageBucket: "projectfinalwebapplication2025.firebasestorage.app",
    messagingSenderId: "208273531610",
    appId: "1:208273531610:web:9e63062d6509fb92da7be3",
    measurementId: "G-TPXDL65PBG"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const handleCheckIn = async (studentId) => {
    try {
      // เช็คชื่อใน Firestore
      const user = auth.currentUser;
      const date = new Date().toISOString().split('T')[0]; // ใช้วันที่ปัจจุบัน
  
      await addDoc(collection(db, 'attendance'), {
        classId: classId,
        studentId: studentId,
        date: date,
        status: 'checked-in',
        timestamp: new Date(),
      });
  
      // อัพเดตสถานะการเช็คชื่อในหน้าจอ
      setCheckedIn((prevState) => ({
        ...prevState,
        [studentId]: 'checked-in',
      }));
  
      console.log('Checked in successfully!');
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };
  
function LandingPage({ onLogin }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundImage: `url(./img/landscape.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed"
        }}>
        <div style={{
            background: "rgba(255, 255, 255, 0.9)",  // เพิ่ม opacity ให้มากขึ้น
            padding: "60px",  // เพิ่มกรอบ (padding) ให้ใหญ่ขึ้น
            borderRadius: "15px",  // เพิ่มมุมโค้งให้กรอบ
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",  // เพิ่มความเข้มของเงากรอบ
            textAlign: "center",
            maxWidth: "500px"  // เพิ่มขนาดกรอบให้กว้างขึ้น
        }}>
        <h2 style={{
            color: "#333", 
            marginBottom: "15px", 
            fontFamily: "Arial, sans-serif", 
            fontSize: "30px", 
            fontWeight: "600"
        }}>
            Professor Classroom Management System
        </h2>
        <p style={{
            color: "#666", 
            marginBottom: "20px", 
            fontFamily: "Arial, sans-serif", 
            fontSize: "16px"
        }}>
            Please log in to manage your courses
        </p>
        <Button
            variant="light"
            onClick={onLogin}
            style={{
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #ddd",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "#444",
                cursor: "pointer",
                transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "#f0f0f0"}
            onMouseOut={(e) => e.target.style.backgroundColor = "white"}
        >
            <img
                src="https://w7.pngwing.com/pngs/882/225/png-transparent-google-logo-google-logo-google-search-icon-google-text-logo-business-thumbnail.png"
                alt="Google Logo"
                width="24"
                height="24"
                style={{ marginRight: "10px" }}
            />
            Log in with Google
        </Button>
        </div>
    </div>
    );
}



function EditProfile({ user, app }) {
    // ตรวจสอบว่ามี user หรือไม่
    if (!user) {
        return <p>กำลังโหลดข้อมูล...</p>;
    }

    const [name, setName] = React.useState(user.displayName || "");
    const [photoURL, setPhotoURL] = React.useState(user.photoURL || "");

    const handleSave = async () => {
        if (!name.trim()) {
            alert("กรุณากรอกชื่อ");
            return;
        }

        try {
            const userRef = db.collection("users").doc(user.uid);

            // อัปเดตข้อมูลใน Firestore
            await userRef.set({ name, photoURL }, { merge: true });

            // อัปเดตข้อมูลใน Firebase Authentication
            await firebase.auth().currentUser.updateProfile({ displayName: name, photoURL: photoURL || "" });

            // ดึงข้อมูลใหม่จาก Firestore
            const updatedDoc = await userRef.get();
            const updatedUserData = updatedDoc.data();

            // อัปเดต state ของ App
            app.setState({ user: { ...app.state.user, displayName: updatedUserData.name, photoURL: updatedUserData.photoURL }, scene: "dashboard" });

            alert("อัปเดตโปรไฟล์สำเร็จ!");

        } catch (error) {
            console.error("เกิดข้อผิดพลาด:", error);
            alert("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
        }
    };

    return (
        <Card className="mt-3">
            <Card.Header><h4>แก้ไขโปรไฟล์</h4></Card.Header>
            <Card.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>ชื่อ</Form.Label>
                        <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" value={user.email} disabled />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>URL รูปภาพ</Form.Label>
                        <Form.Control type="text" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} />
                    </Form.Group>

                    <Button variant="success" onClick={handleSave}>บันทึก</Button>{' '}
                    <Button variant="secondary" onClick={() => app.setState({ scene: "dashboard" })}>ยกเลิก</Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

function AllCourses({ data, app }) {
    console.log("Data received:", data);
    return (
        <Container>
            <Row>
                {data.length > 0 ? (
                    data.map((c) => (
                        <Col key={c.id} md={4} className="mb-4">
                            <Card className="h-100 shadow-sm">
                                <Card.Img variant="top" src={c.info.photo} alt="Subject" />
                                <Card.Body>
                                    <Card.Title>{c.info.name}</Card.Title>
                                    <Card.Text>
                                        <strong>รหัสวิชา:</strong> {c.info.code} <br />
                                        <strong>ห้องเรียน:</strong> {c.info.room}
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer className="text-center">
                                    <Button variant="warning" onClick={() => app.manageCourse(c)} className="me-2">จัดการ</Button>
                                    <Button variant="danger" onClick={() => app.delete(c)}>ลบ</Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))
                ) : (
                    <Col className="text-center">
                        <p>ไม่มีข้อมูลรายวิชา</p>
                    </Col>
                )}
            </Row>
        </Container>
    );
}
function AddSubject({ user, app }) {
    const [subjectCode, setSubjectCode] = React.useState("");
    const [subjectName, setSubjectName] = React.useState("");
    const [roomName, setRoomName] = React.useState("");
    const [photoURL, setPhotoURL] = React.useState("");

    const handleSave = async () => {
        if (!subjectCode || !subjectName || !roomName) {
            alert("กรุณากรอกให้ครบทุกช่อง");
            return;
        }
        const cid = await addClassroom(user.uid, subjectCode, subjectName, roomName, photoURL);
        alert("เพิ่มรายวิชาสำเร็จ");
        app.setState({ scene: "dashboard" });
        app.readData(); // Reload course list
    };

    return (
        <Card>
            <Card.Header><h4>เพิ่มวิชา</h4></Card.Header>
            <Card.Body>
                <label>รหัสวิชา</label>
                <input type="text" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} className="form-control" />

                <label>ชื่อวิชา</label>
                <input type="text" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} className="form-control" />

                <label>ห้องที่สอน</label>
                <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} className="form-control" />

                <label>รูปภาพ</label>
                <input type="text" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} className="form-control" />

                <Button variant="success" onClick={handleSave} className="mt-3">บันทึกวิชา</Button>{' '}
                <Button variant="secondary" onClick={() => app.setState({ scene: "dashboard" })} className="mt-3">ยกเลิก</Button>
            </Card.Body>
        </Card>
    );
}

async function addClassroom(uid, code, name, room, photoURL) {
    const cid = db.collection("classroom").doc().id;
    const classroomData = {
        owner: uid,
        info: { code, name, room, photo: photoURL || "" }
    };
    await db.collection("classroom").doc(cid).set(classroomData);
    await db.collection("users").doc(uid).collection("classroom").doc(cid).set({ status: 1 });
    return cid;
}

// แก้ไข ManagaCourse component เพื่อเพิ่มแท็บคำถาม
function ManagaCourse({ course, app }) {
    const [tab, setTab] = React.useState("details");

    return (
        <Card>
            <Card.Header>
                <h4>จัดการรายวิชา: {course.info.name}</h4>
                <Button variant="secondary" onClick={() => app.setState({ scene: "dashboard" })}>ย้อนกลับ</Button>
            </Card.Header>

            <Card.Body>
                <nav className="nav nav-tabs">
                    <a className={`nav-link ${tab === "details" ? "active" : ""}`} onClick={() => setTab("details")}>รายละเอียด</a>
                    <a className={`nav-link ${tab === "qrcode" ? "active" : ""}`} onClick={() => setTab("qrcode")}>QR Code</a>
                    <a className={`nav-link ${tab === "students" ? "active" : ""}`} onClick={() => setTab("students")}>นักเรียน</a>
                    <a className={`nav-link ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>เช็คชื่อ</a>
                    <a className={`nav-link ${tab === "questions" ? "active" : ""}`} onClick={() => setTab("questions")}>คำถาม</a>
                    
                </nav>

                <div className="mt-3">
                    {tab === "details" && <CourseDetails course={course} />}
                    {tab === "qrcode" && <CourseQRCode cid={course.id} />}
                    {tab === "students" && <StudentList cid={course.id} />}
                    {tab === "attendance" && <Attendance cid={course.id} />}
                    {tab === "questions" && <ClassQuestions cid={course.id} user={app.state.user} />}
                </div>
            </Card.Body>
        </Card>
    );
}
function CourseDetails({ course }) {
    return (
        <Container className="mt-4">
            <Row className="align-items-center">
                <Col md={6}>
                    <h5>รหัสวิชา: {course.info.code}</h5>
                    <h5>ชื่อวิชา: {course.info.name}</h5>
                    <h5>ห้องที่สอน: {course.info.room}</h5>
                </Col>
                <Col md={6} className="text-center">
                    <img
                        src={course.info.photo}
                        alt="Subject Image"
                        width="100%"
                        style={{ maxWidth: "400px", borderRadius: "10px" }}
                    />
                </Col>
            </Row>
        </Container>
    );
}
function CourseQRCode({ cid }) {
    return (
        <div className="text-center">
            <h5>QR Code สำหรับเข้าร่วม</h5>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${cid}`} alt="QR Code" />
        </div>
    );
}
function StudentList({ cid }) {
    const [students, setStudents] = React.useState([]);

    React.useEffect(() => {
        db.collection(`classroom/${cid}/students`).get().then((querySnapshot) => {
            setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
    }, [cid]);

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>ลำดับ</th>
                    <th>รหัส</th>
                    <th>ชื่อ</th>
                    <th>รูปภาพ</th>
                    <th>สถานะ</th>
                </tr>
            </thead>
            <tbody>
                {students.map((s, index) => (
                    <tr key={s.id}>
                        <td>{index + 1}</td>
                        <td>{s.id}</td>
                        <td>{s.name}</td>
                        <td><img src={s.photo} alt="Student" width="50" /></td>
                        <td>{s.status}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}

function Attendance({ cid }) {
    const [attendances, setAttendances] = React.useState([]);

    React.useEffect(() => {
        const unsubscribe = db.collection(`classroom/${cid}/attendance`)
            .orderBy('date', 'desc')
            .onSnapshot((querySnapshot) => {
                const attendanceData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setAttendances(attendanceData);
            });

        return () => unsubscribe();
    }, [cid]);

    const handleAddAttendance = async () => {
        const newAttendanceRef = db.collection(`classroom/${cid}/attendance`).doc();
        await newAttendanceRef.set({
            date: firebase.firestore.Timestamp.now(),
            attendees: [],
        });
        alert("เพิ่มการเช็คชื่อสำเร็จ");
    };

    return (
        <div>
            <Button variant="success" onClick={handleAddAttendance}>เพิ่มการเช็คชื่อ</Button>
            <h5>ประวัติการเช็คชื่อ</h5>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ลำดับ</th>
                        <th>วัน-เวลา</th>
                        <th>จำนวนคนเข้าเรียน</th>
                        <th>สถานะ</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {attendances.map((att, index) => (
                        <tr key={att.id}>
                            <td>{index + 1}</td>
                            <td>{att.date.toDate().toLocaleString()}</td>
                            <td>{att.attendees.length}</td>
                            <td>{att.status}</td>
                            <td>
                                {/* คุณสามารถเพิ่มปุ่มการจัดการอื่น ๆ ได้ เช่น แก้ไขหรือลบ */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
}

// อัพเดทฟังก์ชัน ClassQuestions ให้มีการตรวจสอบและแสดงผลข้อมูลที่ดีขึ้น
function ClassQuestions({ cid, user }) {
    const [questions, setQuestions] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        console.log("Fetching questions for course ID:", cid);
        setLoading(true);
        setError(null);
        
        // ตรวจสอบว่ามี cid หรือไม่
        if (!cid) {
            console.error("No course ID provided");
            setError("ไม่มีรหัสวิชา กรุณาลองใหม่อีกครั้ง");
            setLoading(false);
            return;
        }

        try {
            // สร้างการติดตาม (subscription) ไปยังคอลเลกชัน questions
            const unsubscribe = db.collection("questions")
                .where("courseId", "==", cid)
                .orderBy("timestamp", "desc")
                .onSnapshot(
                    (snapshot) => {
                        console.log("Questions snapshot received, count:", snapshot.docs.length);
                        
                        const questionsData = snapshot.docs.map(doc => {
                            const data = doc.data();
                            console.log("Question data:", data);
                            
                            // ตรวจสอบและแปลง timestamp
                            let formattedTimestamp;
                            try {
                                formattedTimestamp = data.timestamp ? data.timestamp.toDate() : new Date();
                            } catch (e) {
                                console.error("Error converting timestamp:", e);
                                formattedTimestamp = new Date();
                            }
                            
                            return {
                                id: doc.id,
                                ...data,
                                timestamp: formattedTimestamp
                            };
                        });
                        
                        setQuestions(questionsData);
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Error fetching questions:", error);
                        setError(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message}`);
                        setLoading(false);
                    }
                );

            // ยกเลิกการติดตามเมื่อ Component ถูกลบ
            return () => {
                console.log("Unsubscribing from questions snapshot");
                unsubscribe();
            };
        } catch (error) {
            console.error("Exception in setting up snapshot:", error);
            setError(`เกิดข้อผิดพลาดในการตั้งค่าการดึงข้อมูล: ${error.message}`);
            setLoading(false);
        }
    }, [cid]);

    const askNewQuestion = () => {
        const questionText = prompt("กรุณากรอกคำถามที่ต้องการส่งถึงอาจารย์:");
        if (!questionText || questionText.trim() === "") return;
        
        console.log("Adding new question to course:", cid);
        
        // ข้อมูลคำถามที่จะบันทึก
        const questionData = {
            text: questionText.trim(),
            courseId: cid,
            userId: user.uid,
            userName: user.displayName || "ไม่ระบุชื่อ",
            userPhoto: user.photoURL || "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending"
        };
        
        console.log("Question data to save:", questionData);
        
        db.collection("questions").add(questionData)
        .then((docRef) => {
            console.log("Question added successfully with ID:", docRef.id);
            alert("ส่งคำถามเรียบร้อยแล้ว");
        })
        .catch(error => {
            console.error("Error adding question:", error);
            alert(`เกิดข้อผิดพลาดในการส่งคำถาม: ${error.message}`);
        });
    };

    // ฟังก์ชันสำหรับตรวจสอบโครงสร้างฐานข้อมูล
    const debugDatabase = () => {
        console.log("Debugging database for course ID:", cid);
        
        // ตรวจสอบว่าคอลเลกชัน questions มีอยู่หรือไม่
        db.collection("questions").get()
            .then(snapshot => {
                console.log("Total questions in database:", snapshot.docs.length);
                
                // ดึงข้อมูลทั้งหมดโดยไม่มีเงื่อนไข where
                snapshot.docs.forEach(doc => {
                    console.log("Question ID:", doc.id, "Data:", doc.data());
                });
                
                alert(`จำนวนคำถามทั้งหมดในฐานข้อมูล: ${snapshot.docs.length}`);
            })
            .catch(error => {
                console.error("Error checking questions collection:", error);
                alert(`เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล: ${error.message}`);
            });
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>คำถามในห้องเรียน</h4>
                <div>
                    <Button variant="primary" onClick={askNewQuestion} className="me-2">ถามคำถามใหม่</Button>
                    <Button variant="secondary" onClick={debugDatabase}>ตรวจสอบฐานข้อมูล</Button>
                </div>
            </div>
            
            {loading ? (
                <div className="text-center p-4">
                    <p>กำลังโหลดข้อมูล...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => window.location.reload()}>โหลดหน้าใหม่</Button>
                </Alert>
            ) : questions.length > 0 ? (
                <div>
                    <p>พบคำถามทั้งหมด {questions.length} รายการ</p>
                    
                    {questions.map((question) => (
                        <Card key={question.id} className="mb-3">
                            <Card.Header>
                                <div className="d-flex align-items-center">
                                    {question.userPhoto ? (
                                        <img 
                                            src={question.userPhoto} 
                                            alt="User" 
                                            width="30" 
                                            height="30" 
                                            className="rounded-circle me-2" 
                                        />
                                    ) : (
                                        <div className="bg-secondary rounded-circle me-2" style={{ width: 30, height: 30 }}></div>
                                    )}
                                    <span className="me-2">{question.userName || "ไม่ระบุชื่อ"}</span>
                                    <small className="text-muted ms-auto">
                                        {question.timestamp.toLocaleString('th-TH')}
                                    </small>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <Card.Text>{question.text}</Card.Text>
                                
                                {question.status === "answered" && question.answer && (
                                    <div className="mt-3 p-3 bg-light rounded">
                                        <p className="fw-bold">คำตอบ:</p>
                                        <p>{question.answer}</p>
                                        {question.answeredByName && (
                                            <p className="text-muted small mb-0">
                                                ตอบโดย: {question.answeredByName}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Card.Body>
                            <Card.Footer className="d-flex justify-content-end">
                                {user && user.uid && (
                                    <>
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm"
                                            onClick={() => {
                                                const answer = prompt("กรุณากรอกคำตอบ:");
                                                if (answer && answer.trim()) {
                                                    db.collection("questions").doc(question.id).update({
                                                        answer: answer.trim(),
                                                        answeredBy: user.uid,
                                                        answeredByName: user.displayName || "อาจารย์",
                                                        answeredAt: firebase.firestore.FieldValue.serverTimestamp(),
                                                        status: "answered"
                                                    }).then(() => {
                                                        alert("บันทึกคำตอบเรียบร้อย");
                                                    }).catch(err => {
                                                        console.error("Error saving answer:", err);
                                                        alert("เกิดข้อผิดพลาดในการบันทึกคำตอบ");
                                                    });
                                                }
                                            }}
                                            className="me-2"
                                        >
                                            {question.status === "answered" ? "แก้ไขคำตอบ" : "ตอบคำถาม"}
                                        </Button>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => {
                                                if (window.confirm("ต้องการลบคำถามนี้ใช่หรือไม่?")) {
                                                    db.collection("questions").doc(question.id).delete()
                                                        .then(() => alert("ลบคำถามเรียบร้อย"))
                                                        .catch(err => {
                                                            console.error("Error deleting question:", err);
                                                            alert("เกิดข้อผิดพลาดในการลบคำถาม");
                                                        });
                                                }
                                            }}
                                        >
                                            ลบคำถาม
                                        </Button>
                                    </>
                                )}
                            </Card.Footer>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center p-5 bg-light rounded">
                    <p className="mb-0">ไม่มีคำถามในวิชานี้ กดปุ่ม "ถามคำถามใหม่" เพื่อเริ่มต้น</p>
                </div>
            )}
        </div>
    );
}

class App extends React.Component {
    state = {
        scene: "dashboard",
        courses: [],
        user: null,
        currentCourse: null,
    };
   // ฟังก์ชันที่ปรับปรุงสำหรับการถามคำถามจากหน้าหลัก
askQuestion = () => {
    console.log("askQuestion called, current scene:", this.state.scene);
    
    // ถ้าไม่ได้อยู่ในหน้าจัดการวิชาหรือไม่มีวิชาที่เลือก
    if (this.state.scene !== "manageCourse" || !this.state.currentCourse) {
        const courses = this.state.courses;
        console.log("Available courses:", courses);
        
        if (courses.length === 0) {
            alert("คุณยังไม่มีวิชา กรุณาเพิ่มวิชาก่อนถามคำถาม");
            return;
        }
        
        // สร้างตัวเลือกวิชา
        let courseOptions = "เลือกวิชาที่ต้องการถามคำถาม:\n";
        courses.forEach((course, index) => {
            courseOptions += `${index + 1}. ${course.info.name} (${course.info.code})\n`;
        });
        
        // ให้ผู้ใช้เลือกวิชา
        const selectedIndex = prompt(courseOptions);
        if (!selectedIndex || isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > courses.length) {
            alert("กรุณาเลือกวิชาให้ถูกต้อง");
            return;
        }
        
        // เก็บวิชาที่เลือก
        const selectedCourse = courses[parseInt(selectedIndex) - 1];
        console.log("Selected course:", selectedCourse);
        
        // ถามคำถาม
        const questionText = prompt(`กรุณากรอกคำถามสำหรับวิชา "${selectedCourse.info.name}":`);
        if (!questionText || questionText.trim() === "") return;
        
        console.log("Adding question to course:", selectedCourse.id);
        
        // ข้อมูลคำถาม
        const questionData = {
            text: questionText.trim(),
            courseId: selectedCourse.id,
            userId: this.state.user.uid,
            userName: this.state.user.displayName || "ไม่ระบุชื่อ",
            userPhoto: this.state.user.photoURL || "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending"
        };
        
        // บันทึกคำถาม
        db.collection("questions").add(questionData)
        .then((docRef) => {
            console.log("Question added with ID:", docRef.id);
            alert(`ส่งคำถามถึงวิชา "${selectedCourse.info.name}" เรียบร้อยแล้ว`);
        })
        .catch(error => {
            console.error("Error adding question:", error);
            alert(`เกิดข้อผิดพลาดในการส่งคำถาม: ${error.message}`);
        });
    } else {
        // กรณีอยู่ในหน้าจัดการวิชาอยู่แล้ว
        console.log("Already in course management, current course:", this.state.currentCourse.id);
        
        const questionText = prompt(`กรุณากรอกคำถามสำหรับวิชา "${this.state.currentCourse.info.name}":`);
        if (!questionText || questionText.trim() === "") return;
        
        // ข้อมูลคำถาม
        const questionData = {
            text: questionText.trim(),
            courseId: this.state.currentCourse.id,
            userId: this.state.user.uid,
            userName: this.state.user.displayName || "ไม่ระบุชื่อ",
            userPhoto: this.state.user.photoURL || "",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "pending"
        };
        
        // บันทึกคำถาม
        db.collection("questions").add(questionData)
        .then((docRef) => {
            console.log("Question added with ID:", docRef.id);
            alert("ส่งคำถามเรียบร้อยแล้ว");
        })
        .catch(error => {
            console.error("Error adding question:", error);
            alert(`เกิดข้อผิดพลาดในการส่งคำถาม: ${error.message}`);
        });
    }
};

// แยกส่วนการถามคำถามออกมาเป็นฟังก์ชันใหม่
promptForQuestion = () => {
    const questionText = prompt("กรุณากรอกคำถามที่ต้องการส่งถึงอาจารย์:");
    if (!questionText || questionText.trim() === "") return;
    
    db.collection("questions").add({
        text: questionText.trim(),
        courseId: this.state.currentCourse.id,
        userId: this.state.user.uid,
        userName: this.state.user.displayName,
        userPhoto: this.state.user.photoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: "pending" // pending, answered, rejected
    })
    .then(() => {
        alert("ส่งคำถามเรียบร้อยแล้ว");
    })
    .catch(error => {
        console.error("เกิดข้อผิดพลาดในการส่งคำถาม:", error);
        alert("เกิดข้อผิดพลาดในการส่งคำถาม");
    });
};
    fetchQuestions = () => {
        if (!this.state.currentCourse) return;

        db.collection("questions")
            .where("courseId", "==", this.state.currentCourse.id)
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
                const questions = snapshot.docs.map(doc => doc.data().text);
                this.setState({ questions });
            });
    };
componentDidMount() {
        this.fetchQuestions(); // โหลดคำถามเมื่อแอปเริ่มต้น
    }
    constructor() {
        super();
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                this.setState({ user: user.toJSON() });
                const userRef = db.collection("users").doc(user.uid);
                const doc = await userRef.get();

                if (!doc.exists) {
                    // สร้างบัญชีผู้ใช้ใหม่ใน Firestore
                    await userRef.set({
                        name: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                    });
                }

                this.readData();
            } else {
                this.setState({ user: null, courses: [], scene: "dashboard" });
            }
        });
    }
    google_login = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" }); // บังคับเลือกบัญชีใหม่ทุกครั้ง
        firebase.auth().signInWithPopup(provider);
    };

    google_logout = () => {
        if (window.confirm("ต้องการออกจากระบบ?")) {
            firebase.auth().signOut().then(() => {
                this.setState({ user: null });
            });
        }
    };
    readData = () => {
        if (!this.state.user) return;
        db.collection("classroom")
            .where("owner", "==", this.state.user.uid)
            .get()
            .then((querySnapshot) => {
                this.setState({
                    courses: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                });
            })
            .catch((error) => {
                console.error("Error fetching courses:", error);
            });
    };
    delete = (course) => {
        if (window.confirm("ต้องการลบข้อมูลนี้ใช่มั้ย")) {
            db.collection("users").doc(this.state.user.uid).collection("classroom").doc(course.id).delete()
                .then(() => {
                    return db.collection("classroom").doc(course.id).delete();
                })
                .then(() => {
                    this.readData();
                })
                .catch(error => {
                    console.error("Error removing document: ", error);
                });
        }
    };
    manageCourse = (course) => {
        this.setState({
            scene: "manageCourse",
            currentCourse: course
        });
    }

    

    render() {
        if (!this.state.user) return <LandingPage onLogin={this.google_login} />;
        return (
            <Card>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f9d5cd",
                    height: "100vh",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                    padding: "20px"
                }}>
                    <Card.Header style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#ffffff",
                        padding: "20px",
                        borderRadius: "12px",
                        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                        width: "100%",
                        textAlign: "center"
                    }}>
                        <img src={this.state.user.photoURL} alt="Profile" width="150" className="rounded-circle" style={{ marginBottom: "15px" }} />
                        <h4 style={{ marginBottom: "10px", fontSize: "30px" }}>{this.state.user.displayName}</h4>
                        <p style={{ color: "#777", marginBottom: "20px", fontSize: "18px" }}>({this.state.user.email})</p>

                        <div style={{ display: "flex", flexDirection: "row", gap: "10px", width: "25%", height: "55px" }}>
                            <Button variant="primary" onClick={() => this.setState({ scene: "addSubject" })} style={{ width: "100%" }}>
                                เพิ่มวิชา
                            </Button>
                            <Button variant="secondary" onClick={() => this.setState({ scene: "editProfile" })} style={{ width: "100%" }}>
                                แก้ไขโปรไฟล์
                            </Button>
                            <Button variant="danger" onClick={this.google_logout} style={{ width: "100%" }}>
                                ออกจากระบบ
                            </Button>
                            {/* เพิ่มปุ่มใหม่เพื่อเรียกฟังก์ชันถามคำถาม
                            <Button variant="info" onClick={this.askQuestion} style={{ width: "100%" }}>
                                ถามคำถาม
                            </Button> */}
                        </div>
                    </Card.Header>

                    <Card.Body style={{ width: "100%", paddingTop: "20px" }}>
                        {this.state.scene === "addSubject" ? (
                            <AddSubject user={this.state.user} app={this} />
                        ) : this.state.scene === "editProfile" ? (
                            <EditProfile user={this.state.user} app={this} />
                        ) : this.state.scene === "manageCourse" ? (
                            <ManagaCourse course={this.state.currentCourse} app={this} />
                        ) : (
                            <AllCourses data={this.state.courses} app={this} />
                        )}
                    </Card.Body>
                </div>
            </Card>
        );
    }
}

const root = ReactDOM.createRoot(document.getElementById("webapp"));
root.render(<App />); 