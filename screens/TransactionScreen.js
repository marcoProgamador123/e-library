import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  ToastAndroid
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config"
import firebase from "firebase/compat";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: "",
      studentId: "",
      bookName: "",
      studentName: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false
    };
  }

  getCameraPermissions = async domState => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" é verdadeiro se o usuário concedeu permissão
          status === "granted" é falso se o usuário não concedeu permissão
        */
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true
      });
    }
  };
  handleTransaction = async() => {
    var { bookId, studentId } = this.state
     await this.getBookDetails(bookId)
     await this.getStudentDetails(studentId)
      //a checkBookAvailability pode retornar false ou seja não existe 
      //tipo de transação                 //se o livro existe retorna issue ou return
     var transaction_Type = await this.checkBookAvailability(bookId)
     //se checkBookAvailability retornar false zeramos os states 
     // e mandamos a mensagem livor não existe
     if(!transaction_Type){
       this.setState({
         bookId:"",
         studentId:""
       })
       ToastAndroid.show(" o livro não existe", ToastAndroid.SHORT)
     } 
     // se não retornar false e nem return, a checkBookAvailability retornar issue 
     else if(transaction_Type==="issue"){
                                  //esta função verifica a elegibilidade do aluno para a emissão do
                                  //livro para o aluno
       var isElegible=await this.checkStudentElegibilityForBookIssue(studentId)
       if(isElegible){
        var {bookName,studentName}=this.state

        //a função initiateBookIssue inicia a emissão do livro para o aluno 
        // e quando a emissão do livro for feita retornamos a mensagem livro retirado com sucesso
        this.initiateBookIssue(bookId,studentId,bookName,studentName)
        ToastAndroid.show("livro retirado com sucesso",ToastAndroid.SHORT)
       }
     }
      //se não retornar false nem issue, a checkBookAvailability retornar return
     else{
                                  //esta função verifica a elegibilidade do aluno para a devolução do
                                  //livro
       var isElegible=await this.checkStudentElegibilityForBookReturn(bookId,studentId)
       if(isElegible){
        var {bookName,studentName}=this.state

        //a função initiateBookReturn inicia a devolução do livro para a biblioteca
        // e quando a devolução do livro for feita retornamos a mensagem livro devolvido com sucesso
        this.initiateBookReturn(bookId,studentId,bookName,studentName)
        ToastAndroid.show("livro devolvido com sucesso",ToastAndroid.SHORT)
       }
     }  

  }
  // obter detalhes do livro
  getBookDetails = bookId => {
    bookId = bookId.trim();
    //busca a coleção no firestore
    db.collection("books")
        //procura o dado no documento 
      .where("book_id", "==", bookId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            bookName: doc.data().book_name
          });
        });
      });
  };

  getStudentDetails = studentId => {
    studentId = studentId.trim();
    db.collection("students")
      .where("student_id", "==", studentId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            studentName: doc.data().student_name
          });
        });
      });
  };
  initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
    //criando nova transação
    db.collection("transactions").add({
      book_name: bookName,
      book_id: bookId,
      student_name: studentName,
      student_id: studentId,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue"
    })
    //alterar status do livro
    db.collection("books")
      .doc(bookId).update({
        is_book_avaliable: false
      })
    //alterar numeros de livros retirados pelo aluno
    db.collection("students")
      .doc(studentId).update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(1)
      })
    //atualizando estado local 
    this.setState({
      bookId: "",
      studentId: "",
    })
  }

  initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
    // adicionar uma transação
    db.collection("transactions").add({
      student_id: studentId,
      student_name: studentName,
      book_id: bookId,
      book_name: bookName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return"
    });
    // alterar status do livro
    db.collection("books")
      .doc(bookId)
      .update({
        is_book_avaliable: true
      });
    // alterar o número de livros retirados pelo aluno
    db.collection("students")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(-1)
      });

    // atualizando estado local
    this.setState({
      bookId: "",
      studentId: ""
    });
  };
  //verifica a disponibilidade do livro
  checkBookAvailability = async bookId => {
    const bookRef = await db
      //busca a coleção no firestore
      .collection("books")
      //procura o dado no documento
      .where("book_id", "==", bookId)
      .get()

      //coletamos os dados e verificamos se o livro existe
      //se não, retornamos falso
      //se sim retornamos a disponibilidade atual do livro
    var transactionType = ""
    if (bookRef.docs.length == 0) {
      transactionType = false
    } else {
      bookRef.docs.map(doc => {
        //se o livro estiver disponível, o tipo da transação será issue
        //se não, será return
        transactionType = doc.data().is_book_available ? "issue" : "return"
      })
    }
    return transactionType
  }
  //verifica a elegibilidade do aluno para a emissão do livro 
  checkStudentElegibilityForBookIssue = async studentId => {
    const studentRef = await db
    //busca a coleção no firestore
      .collection("students")
      //procura o dado no documento 
      .where("student_id","==",studentId)
      .get()

      //verificamos se o estudante existe
      //se não informamos que o aluno não existe
    var isStudentElegible = ""
    if (studentRef.docs.length == 0) {
      this.setState({
        bookId: "",
        studentId:""
      })
      isStudentElegible = false
      Alert.alert("O ID do aluno não existe em nosso banco de dados!")
    } else {
      //se o estudante existir verificamos se ele pegou menos de dois livros
      //se sim retornamos true para a elegibilidade do aluno
      //se não retornamos falso e informamos ao usuário que o aluno esta com 2 livros alugados
      studentRef.docs.map(doc =>{
        if (doc.data().number_of_books_issued < 2) {
          isStudentElegible = true
        } else {
          isStudentElegible = false
          Alert.alert("O aluno já retirou 2 livros!")
          this.setState({
            bookId:"",
            studentId:""
          })
        }
      })
    }
    return isStudentElegible
  }
  //verifica a elegibilidade do aluno para a devolução do livro 
  checkStudentElegibilityForBookReturn = async (bookId, studentId) => {
    //coletando as informações no banco de dados
    const transactionRef = await db
      .collection("transactions")
      .where("book_id","==",bookId)
      .limit(1)
      .get()

      //verificamos se o livro foi retirado por esse estudante
      //se sim, retornamos true
      //se não, retornamos false e informamos que o livro não foi retirado por esse estudante.
    var isStudentElegible = ""
    transactionRef.docs.map(doc => {
      var lastBookTransaction = doc.data()
      if (lastBookTransaction.student_id === studentId) {
        isStudentElegible = true;
      } else {
        isStudentElegible = false
        Alert.alert("O livro não foi retirado por esse aluno!")
        this.setState({
          bookId:"",
          studentId:""
        })
      }
      
    })
    return isStudentElegible
  }
  render() {
    const { bookId, studentId, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Livro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
                onChangeText={text => this.setState({bookId:text})}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Estudante"}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
                onChangeText={text => this.setState({studentId:text})}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button}
              onPress={this.handleTransaction()}>
              <Text style={styles.buttonText}>
                enviar
              </Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center"
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80
  },
  appName: {
    width: 180,
    resizeMode: "contain"
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 20,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold"
  },
  button: {
    marginTop: 25,
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f48d20",
    borderRadius: 15
  },
  buttonText: {
    fontSize: 24,
    color: "#ffffff",
    fontFamily: "Rajdhani_600SemiBold"
  }
});
