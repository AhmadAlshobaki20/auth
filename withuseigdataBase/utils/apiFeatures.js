class apiFeatures {
  // we will recive tow argument here (dataBase query, query from the client)
  constructor(dbQuery, reqQuery){
    this.dbQuery = dbQuery;
    this.reqQuery = reqQuery;
  }
  filter(){
    // filter featuers
    const queryObj= {...this.reqQuery}; 
    const excludedFeatures = ['sort', 'page', 'fields', 'limit']
    excludedFeatures.forEach((el)=>{
      delete queryObj[el];
    })    
    // AdvanceFilter [$gte, $gt, $lte,$lt]
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace((/\b(gte|gt|lt|lte)\b/g),match=> `$${match}`);
    this.dbQuery.find(JSON.parse(queryString));
  }

  sort(){
    if(this.reqQuery.sort){
      const sortBy = JSON.stringify(this.reqQuery).sort.split(',').json(' ');
      this.dbQuery = this.dbQuery.sort(sortBy);
    }
    return this;
  }

  fileds(){
    if(this.reqQuery.fileds){
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.dbQuery = this.dbQuery.select(fields);
    }else{
      this.dbQuery = this.dbQuery.select('__V');
    }
    return this;
  }

  page(){
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 1000;
    const skip = limit * (page - 1);
    if(this.reqQuery.page){
      this.dbQuery = this.dbQuery.skip(skip).limit(limit);
    }
    return this;
  }
}

module.exports = apiFeatures;