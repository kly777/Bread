export default defineContentScript({
  matches: ['*'],
  main() {
    console.log('Hello content.');
    const pTags = document.getElementsByTagName('p');
    console.log(`Number of <p> tags: ${pTags.length}`);
  },
});
