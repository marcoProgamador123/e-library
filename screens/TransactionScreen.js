import React, {Component}from "react"
import { View,Text,TouchableOpacity } from "react-native"
import *as Permissions from "expo-permissions"
import { BarCodeScanner } from "expo-barcode-scanner"
import styles from "./styles"

export default class TransactionScreen extends Component{
    constructor(props){
        super(props)
        this.state ={
            domState:"normal",
            hasCameraPermission:null,
            scanned:false,
            scannedData:""
        }
    }
    getCameraPermissions=async domState =>{
        const{status}=await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermission:status==="granted",
            domState:domState,
            scanned:false
        })
    }
    handleBarCodeScanned=async({type,data})=>{
        this.setState({
            scannedData:data,
            domState:"normal",
            scanned:true
        })
    }
    render(){
        const{domState,hasCameraPermission,scannedData,scanned}=this.state
        if (domState==="scanner") {
            return(
                <BarCodeScanner
                    onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                    />
            )
        }
        return(
            <View style={styles.container}>
                <Text style={styles.text}>
                    {hasCameraPermission?scannedData:"solicitar permissão para camera"}
                </Text>
                <TouchableOpacity style={styles.button} onPress={()=>this.getCameraPermissions("scanner")} >
                    <Text style={styles.buttonText}>
                        digitalizador QRcode
                    </Text>
                </TouchableOpacity>
                
            </View>
        )
    }
}
