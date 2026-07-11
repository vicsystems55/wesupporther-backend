const bcrypt=require("bcrypt");

const prisma=require("../src/config/database");


async function main(){

const password=await bcrypt.hash(
"password123",
10
);


await prisma.admin.create({

data:{
name:"Super Admin",
email:"admin@wesupporther.org",
password
}

});


}


main()
.then(()=>{
console.log("Admin created");
})
.catch(console.error);