import React,{Component} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons"

import TransactionScreen from "../screens/TransactionScreen";
import SearchScreen from "../screens/SearchScreen";

const Tab = createBottomTabNavigator()

export default class BottomTabNavigator extends Component{
    render(){
        return(
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({route}) =>({
                        tabBarIcon:({focused,color,size})=>{
                            var iconName
                            if (route.name==="transação") {
                                iconName="book"
                            }
                            else if(route.name==="pesquisa"){
                                iconName="search"
                            }
                            return(
                                <Ionicons name={iconName} size={size} color={color}  />

                                
                            )

                        }

                    })} 
                    tabBarOptions={{
                        activeTintColor: "#FFFFFF",
                        inactiveTintColor: "black",
                        style: {
                          height: 130,
                          borderTopWidth: 0,
                          backgroundColor: "#5653d4"
                        },
                        labelStyle: {
                          fontSize: 20,
                          fontFamily: "Rajdhani_600SemiBold"
                        },
                        labelPosition: "beside-icon",
                        tabStyle: {
                          marginTop: 25,
                          marginLeft: 10,
                          marginRight: 10,
                          borderRadius: 30,
                          borderWidth: 2,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#5653d4"
                        }
                      }}
                    >

                    <Tab.Screen name="transação" component={TransactionScreen} />

                    <Tab.Screen name="pesquisa" component={SearchScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        )
    }
}
