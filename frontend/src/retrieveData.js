export async function retrieveData() {
    try {
      const response = await fetch(`http://192.168.86.195:3000/results`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error retrieving data:', error);
    }
}
