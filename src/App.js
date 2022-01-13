import React, {Component} from 'react';
import './App.css';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import Clarifai from 'clarifai';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import SignIn from './components/SignIn/SignIn';
import Register from './components/Register/Register';

//configure Clarifai API using provided key
const app = new Clarifai.App({
 apiKey: '098ca16998ad4b0c8f5f66317ccacecc'
});

//initialize app state
const initialState ={
    input: '',
    imageUrl:'',
    box: {},
    route: 'signin',
    isSignedIn: false,
    user:{
        id: '',
        name: '',
        email: '',
        entries:0 ,
        joined: ''
    }
}

class App extends Component {
    constructor(){
        super();
        this.state = {
            input: '',
            imageUrl:'',
            box: {},
            route: 'signin',
            isSignedIn: false,
            user:{
                id: '',
                name: '',
                email: '',
                entries:0 ,
                joined: ''
            }
        }
    }

  loadUser=(data)=>{
    this.setState({user:{
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined

    }})
  }


  //determine coordinates for facial recognition display box
  calculateFaceLocation =(data)=>{

    //extracting data from response provided by Clarifia API
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    const clarifaiAge =data.outputs[0].data.regions[0].data.concepts[0].name;
    const clarifaiGender =data.outputs[0].data.regions[0].data.concepts[20].name;
    const clarifaiCultural = data.outputs[0].data.regions[0].data.concepts[22].name;

    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height),
      Age: clarifaiAge,
      Gender: clarifaiGender,
      CulturalAppearance: clarifaiCultural
    }

  }

  //show prediction result to user and siaply facial recognition box
  displayFaceBox =(box) => {
    console.log(box);
    alert(`I have detected that you are a ${box.CulturalAppearance} ${box.Age} year old with a ${box.Gender} facial structure`);
    this.setState({box: box});
  }


  //callback methods to listen for events triggered by user interaction
    onInputChange = (event)=>{
        this.setState({input: event.target.value});
    }

    onButtonSubmit =() =>{
        this.setState({imageUrl: this.state.input});

        app.models.predict(Clarifai.DEMOGRAPHICS_MODEL, this.state.input)
    .then(response => {
      if (response){
        fetch('https://shielded-dawn-72708.herokuapp.com/image',{
                method: 'put',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                id: this.state.user.id
          })
        })
        .then(response=> response.json())
        .then(count => {
          this.setState(Object.assign(this.state.user, {entries: count}))
        })
        .catch(console.log)
      }
      this.displayFaceBox(this.calculateFaceLocation(response))
    })
      .catch(err => console.log(err));
  }

  onRouteChange =(route) =>{
    if(route ==='signout'){
      this.setState(initialState)
    }else if (route === 'home'){
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});

  }
          
                



  render() {
  const {isSignedIn, imageUrl, route, box}=this.state;
  return (
    <div className="App">
      <Navigation isSignedIn ={isSignedIn} onRouteChange={this.onRouteChange}/>
      {route==='home' ? 
        <div>
        <Logo />
        <Rank name={this.state.user.name} entries={this.state.user.entries} />
        <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit ={this.onButtonSubmit} />
        <FaceRecognition box ={box} imageUrl={imageUrl} />
      </div>
      :(
      route==='signin' ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} /> 
      : <Register loadUser ={this.loadUser} onRouteChange={this.onRouteChange} /> 
      )

      }
    </div>
  );

}
}

export default App;
