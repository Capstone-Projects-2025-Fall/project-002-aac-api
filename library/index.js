//sends the received audioBlob to the api
async function sendAudio(audioBlob){
	const formData = new FormData(); //formData constructor
	//add all relevant (type, audio file, name)
      	formData.append('audioFile', audioBlob, 'recording.wav');
	//call the API and store the response
	const response = await fetch('http://localhost:8080/upload', {
        	method: 'POST',
        	body: formData
      	});//end response

     return response //return the response
};//end sendAudio

//format the data for logging purposes
async function formatData(response){
      const data = await response.json();
  return data
};//end formatData

//export the functions
module.exports = {
	sendAudio,
	formatData
};//end function exports