const Preview = ({ image }: { image: string }) => {
  return (
    <figure className="mt-5 max-w-96 mx-auto">
      <img
        src={image}
        alt="User submitted image preview"
        className="w-full max-w-md mx-auto rounded-lg"
      />
    </figure>
  );
};

export default Preview;
