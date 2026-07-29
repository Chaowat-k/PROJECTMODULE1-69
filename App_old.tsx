import {Pressable, Button, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useState } from 'react';

const App = () => {

  const myname: string = "Chaowat Rakkhao";
  const favvoid: string = "( กิต ) กฤตย์ จีรพัฒนานุวงศ์";
  const money: number = 500;
  const stady: boolean = false;

  const [name, setName] = useState<string>("Chaowat Rakkhao");
  const [ages, setAges] = useState<number>(25);

  return (
    <View style={styles.container}>
      <Text>สวัสดี : {myname} </Text>
      <Text>ชื่อดารา / นักร้องที่ชอบ : {favvoid}</Text>
      <Text>Hello Mama!!</Text>
      <Text>เพิ่งเปิดเทอมเหลือเงิน : {money} บาท</Text>
      <Text>วันนี้เรียนง่ายจัง : {stady ? "true" : "false"}</Text>

      <Text>--------------------------------</Text>

      <Text>{name}</Text>
      <Button
        title="Change the name"
        onPress={() => setName("Naniiiiiiii")}
      />

      <Text>อายุ : {ages} ปี</Text>

      <Button
        title="+"
        onPress={() => setAges(ages + 1)}
      />
      <Button
        title="-"
        onPress={() => setAges(ages - 1)}
      />
      <Button
        title="Reset"
        onPress={() => {
          setAges(25);
          setName("Chaowat Rakkhao");
        }}
      />


    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});