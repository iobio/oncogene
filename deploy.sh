#!/bin/bash

#build vue app
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
  aws s3 cp ./dist/  s3://static.iobio.io/prod/oncogene.iobio.io/ --recursive
  aws s3 cp ./src/data/demo.json  s3://static.iobio.io/prod/oncogene.iobio.io/
  aws s3 cp ./.env.local s3://static.iobio.io/prod/oncogene.iobio.io/
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id E2GSUSNN6UD3JT --paths /\*

else
  echo "** Syncing to dev s3 bucket **"
  aws s3 cp  ./dist/  s3://static.iobio.io/dev/oncogene.iobio.io/ --recursive
  aws s3 cp ./src/data/demo.json  s3://static.iobio.io/dev/oncogene.iobio.io/
  aws s3 cp ./.env.local s3://static.iobio.io/dev/oncogene.iobio.io/
  echo "** Renew cloudfrount cache **"
  aws cloudfront create-invalidation --distribution-id E3JJR7QP3DJYDS --paths /\*
fi
