#!/bin/bash

# build vue app
if [[ $1 == "prod" ]]; then
  echo "** Building prod **"
  NODE_ENV=production npm run build
else
  echo "** Building dev **"
  npm run build 
fi

# upload to cloudfront
if [[ $1 == "prod" ]]; then

  echo "** Uploaded to prod s3 bucket **"
  aws s3 sync src/assets/ s3://static.iobio.io/prod/oncogene.iobio.io 
  aws s3 sync dist/ s3://static.iobio.io/prod/oncogene.iobio.io
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id E3JJR7QP3DJYDS --paths /

else
  echo "** Syncing to dev s3 bucket **"
  aws s3 sync src/assets/ s3://static.iobio.io/dev/oncogene.iobio.io 
  aws s3 sync dist/ s3://static.iobio.io/dev/oncogene.iobio.io
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id E3JJR7QP3DJYDS --paths /
fi
