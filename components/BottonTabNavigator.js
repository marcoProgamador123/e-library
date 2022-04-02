import React,{Component} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import TransactionScreen from "../screens/TransactionScreen";
import SearchScreen from "../screens/SearchScreen";

const Tab = createBottomTabNavigator()

export default class BottomTabNavigator extends Component{
    render(){
        return(
            <NavigationContainer>
                <Tab.Navigator>
                    <Tab.Screen name="transação" component={TransactionScreen} />

                    <Tab.Screen name="pesquisa" component={SearchScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        )
    }
}
