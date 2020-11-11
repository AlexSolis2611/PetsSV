import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image, Icon, Button } from "react-native-elements";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-easy-toast";
import Loading from "../components/Loading";

import { firebaseApp } from "../utils/firebase";
import firebase from "firebase";
import "firebase/firestore";

const db = firebase.firestore(firebaseApp);

export default function Favorites(props) {
  const { navigation } = props;
  const [shelterVeterinarians, setShelterVeterinarians] = useState(null);
  const [userLogged, setUserLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [realoadData, setRealoadData] = useState(false);
  const toastRef = useRef();
  console.log(shelterVeterinarians);

  firebase.auth().onAuthStateChanged((user) => {
    user ? setUserLogged(true) : setUserLogged(false);
  });

  useFocusEffect(
    useCallback(() => {
      if (userLogged) {
        const idUser = firebase.auth().currentUser.uid;
        db.collection("favorites")
          .where("idUser", "==", idUser)
          .get()
          .then((response) => {
            const idSVArray = [];
            response.forEach((doc) => {
              idSVArray.push(doc.data().idSV);
            });
            getDataSV(idSVArray).then((response) => {
              const shelterVeterinarians = [];
              response.forEach((doc) => {
                const shelterVeterinarian = doc.data();
                shelterVeterinarian.id = doc.id;
                shelterVeterinarians.push(shelterVeterinarian);
              });
              setShelterVeterinarians(shelterVeterinarians);
            });
          });
      }
      setRealoadData(false);
    }, [userLogged, realoadData])
  );

  const getDataSV = (idSVArray) => {
    const arraySV = [];
    idSVArray.forEach((idSV) => {
      const result = db.collection("veterinariasrefugios").doc(idSV).get();
      arraySV.push(result);
    });
    return Promise.all(arraySV);
  };

  if (!userLogged) {
    return <UserNoLogged navigation={navigation} />;
  }

  if (shelterVeterinarians?.lenght === 0) {
    return <NotFoundshelterVeterinarians />;
  }

  return (
    <View style={styles.viewBody}>
      {shelterVeterinarians ? (
        <FlatList
          data={shelterVeterinarians}
          renderItem={(shelterVeterinarian) => (
            <ShelterVeterinarian
              shelterVeterinarian={shelterVeterinarian}
              setIsLoading={setIsLoading}
              toastRef={toastRef}
              setRealoadData={setRealoadData}
              navigation={navigation}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <View style={styles.loaderRestaurant}>
          <ActivityIndicator size="large" color="#ab48e0" />
          <Text style={{ textAlign: "center" }}>Cargando Favoritos</Text>
        </View>
      )}
      <Toast ref={toastRef} position="center" opacity={0.9} />
      <Loading text="Eliminando" isVisible={isLoading} />
    </View>
  );
}

function NotFoundshelterVeterinarians() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Icon
        type="material-community"
        name="alert-outline"
        size={50}
        color="#ab48e0"
      />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          color: "#ab48e0",
        }}
      >
        No tienes veterinarias o refugios en tu lista
      </Text>
    </View>
  );
}

function UserNoLogged(props) {
  const { navigation } = props;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Icon
        type="material-community"
        name="alert-outline"
        size={50}
        color="#ab48e0"
      />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          color: "#ab48e0",
        }}
      >
        Necesitas iniciar sesión para ver esta sección
      </Text>
      <Button
        title="Iniciar sesión"
        containerStyle={{ marginTop: 20, width: "80%" }}
        buttonStyle={{ backgroundColor: "#ab48e0" }}
        onPress={() => navigation.navigate("account", { screen: "login" })}
      />
    </View>
  );
}

function ShelterVeterinarian(props) {
  const {
    shelterVeterinarian,
    setIsLoading,
    toastRef,
    setRealoadData,
    navigation,
  } = props;
  const { id, name, images } = shelterVeterinarian.item;

  const confirmRemoveFavorite = () => {
    Alert.alert(
      "Eliminar de favorito",
      "¿Estas seguro que quieres eliminar de favoritos?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: removeFavorite,
        },
      ],
      {
        cancelable: false,
      }
    );
  };

  const removeFavorite = () => {
    setIsLoading(true);
    db.collection("favorites")
      .where("idSV", "==", id)
      .where("idUser", "==", firebase.auth().currentUser.uid)
      .get()
      .then((response) => {
        response.forEach((doc) => {
          const idFavorite = doc.id;
          db.collection("favorites")
            .doc(idFavorite)
            .delete()
            .then(() => {
              setIsLoading(false);
              setRealoadData(true);
              toastRef.current.show("Eliminado correctamente");
            })
            .catch(() => {
              setIsLoading(false);
              toastRef.current.show("Error al eliminar");
            });
        });
      });
  };

  return (
    <View style={styles.shelterVeterinarian}>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("sheltersveterinarians", {
            screen: "shelterveterinarian",
            params: { id, name },
          })
        }
      >
        <Image
          resizeMode="cover"
          style={styles.image}
          PlaceholderContent={<ActivityIndicator color="#fff" />}
          source={
            images[0]
              ? { uri: images[0] }
              : require("../../assets/img/no-image.png")
          }
        />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Icon
            type="material-community"
            name="heart"
            color="#f00"
            containerStyle={styles.favorite}
            onPress={confirmRemoveFavorite}
            underlayColor="transparent"
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  viewBody: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  loaderRestaurant: {
    marginTop: 10,
    marginBottom: 10,
  },
  shelterVeterinarian: {
    margin: 10,
  },
  image: {
    width: "100%",
    height: 180,
  },
  info: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: -10,
    backgroundColor: "#fff",
  },
  name: {
    fontWeight: "bold",
    fontSize: 9.4,
  },
  favorite: {
    marginTop: -35,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 100,
  },
});
